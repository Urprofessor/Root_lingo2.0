'use client';

import { useCallback, useRef } from 'react';
import { useTranslationStore } from './useTranslationStore';
import { runWorkflow } from '@/lib/workflows';
import { useAuthStore } from './useAuthStore';

/**
 * 提供翻译启动 / 取消能力,并把进度回写到 store
 *
 * 后端集中管理 API Key,前端不再需要传 key。
 */
export function useTranslationActions() {
  const setIsTranslating = useTranslationStore((s) => s.setIsTranslating);
  const setResult = useTranslationStore((s) => s.setResult);
  const setActiveOutputLang = useTranslationStore((s) => s.setActiveOutputLang);
  const setError = useTranslationStore((s) => s.setError);
  const setProgress = useTranslationStore((s) => s.setProgress);

  const abortRef = useRef<AbortController | null>(null);

  const startTranslation = useCallback(async () => {
    const store = useTranslationStore.getState();
    const { input, settings } = store;

    setError(null);
    setProgress(null);

    if (!input.text.trim()) {
      setError('请先在左侧输入内容');
      return;
    }
    if (settings.targetLanguages.length === 0) {
      setError('请至少选择一种目标语言');
      return;
    }

    // 检查登录状态
    const auth = useAuthStore.getState();
    if (auth.status !== 'authenticated') {
      setError('未登录,请刷新页面重新登录');
      return;
    }

    abortRef.current = new AbortController();
    setIsTranslating(true);

    const streamingBuf: Record<string, string> = {};

    try {
      const result = await runWorkflow({
        sourceText: input.text,
        settings,
        signal: abortRef.current.signal,
        onProgress: (e) => {
          setProgress({ stage: e.stage, lang: e.lang });

          if (e.type === 'stream' && e.lang && e.text) {
            const key = `${e.stage}:${e.lang}`;
            streamingBuf[key] = (streamingBuf[key] || '') + e.text;
            const current = useTranslationStore.getState().result;
            const nextResult = current
              ? structuredClone(current)
              : {
                  final: {} as Record<string, string>,
                  intermediate: {} as {
                    A?: Record<string, string>;
                    B?: Record<string, string>;
                    judgeReport?: Record<string, string>;
                    initial?: Record<string, string>;
                    selfReviewLog?: Record<string, string>;
                  },
                  meta: {
                    mode: settings.mode,
                    startedAt: Date.now(),
                    finishedAt: 0,
                    durationMs: 0,
                    modelsUsed: [],
                  },
                };

            if (!nextResult.intermediate) nextResult.intermediate = {};

            switch (e.stage) {
              case 'translate':
              case 'optimize':
                nextResult.final[e.lang] = streamingBuf[key];
                break;
              case 'translate-initial':
                nextResult.intermediate.initial = nextResult.intermediate.initial || {};
                nextResult.intermediate.initial[e.lang] = streamingBuf[key];
                break;
              case 'self-review':
                nextResult.intermediate.selfReviewLog = nextResult.intermediate.selfReviewLog || {};
                nextResult.intermediate.selfReviewLog[e.lang] = streamingBuf[key];
                break;
              case 'translate-a':
                nextResult.intermediate.A = nextResult.intermediate.A || {};
                nextResult.intermediate.A[e.lang] = streamingBuf[key];
                break;
              case 'translate-b':
                nextResult.intermediate.B = nextResult.intermediate.B || {};
                nextResult.intermediate.B[e.lang] = streamingBuf[key];
                break;
              case 'judge':
                nextResult.intermediate.judgeReport = nextResult.intermediate.judgeReport || {};
                nextResult.intermediate.judgeReport[e.lang] = streamingBuf[key];
                break;
            }

            setResult(nextResult);
          }
        },
      });

      setResult(result);
      const firstLang = settings.targetLanguages[0];
      if (firstLang) setActiveOutputLang(firstLang);
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') {
        setError('翻译已取消');
      } else {
        setError(e instanceof Error ? e.message : '翻译失败');
      }
    } finally {
      setIsTranslating(false);
      setProgress(null);
      abortRef.current = null;
    }
  }, [setIsTranslating, setResult, setActiveOutputLang, setError, setProgress]);

  const cancelTranslation = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { startTranslation, cancelTranslation };
}
