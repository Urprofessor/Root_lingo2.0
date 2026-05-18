import { chat } from '@/lib/llm/chat';
import {
  buildSystemPrompt,
  buildSelfReviewPrompt,
  buildOptimizePrompt,
} from '@/lib/prompts/builder';
import { loadGlossary } from '@/lib/glossary/loader';
import type { WorkflowContext, WorkflowResult } from './types';
import type { ChatMessage } from '@/types';

/**
 * Single:同一模型完成翻译 → 自审 → 优化三步
 */
export async function singleWorkflow(ctx: WorkflowContext): Promise<WorkflowResult> {
  const { sourceText, settings, signal, onProgress } = ctx;
  const startedAt = Date.now();
  const glossary = loadGlossary(settings.glossaryId);

  const final: Record<string, string> = {};
  const initial: Record<string, string> = {};
  const selfReviewLog: Record<string, string> = {};

  const tasks = settings.targetLanguages.map(async (lang) => {
    const systemPrompt = buildSystemPrompt({
      settings,
      glossary,
      sourceText,
      targetLang: lang,
    });

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: sourceText },
    ];

    // 第一步:初译
    onProgress?.({ type: 'stage-start', stage: 'translate-initial', lang });
    let acc = '';
    const r1 = await chat({
      model: settings.primaryModel,
      messages,
      temperature: 0.3,
      maxTokens: 4096,
      signal,
      onStream: (c) => {
        acc += c;
        onProgress?.({ type: 'stream', stage: 'translate-initial', lang, text: c });
      },
    });
    const initialText = r1.text || acc;
    initial[lang] = initialText;
    onProgress?.({ type: 'stage-end', stage: 'translate-initial', lang, text: initialText });

    // 第二步:自审
    onProgress?.({ type: 'stage-start', stage: 'self-review', lang });
    messages.push({ role: 'assistant', content: initialText });
    messages.push({ role: 'user', content: buildSelfReviewPrompt(lang) });
    let acc2 = '';
    const r2 = await chat({
      model: settings.primaryModel,
      messages,
      temperature: 0.4,
      maxTokens: 2000,
      signal,
      onStream: (c) => {
        acc2 += c;
        onProgress?.({ type: 'stream', stage: 'self-review', lang, text: c });
      },
    });
    const reviewText = r2.text || acc2;
    selfReviewLog[lang] = reviewText;
    onProgress?.({ type: 'stage-end', stage: 'self-review', lang, text: reviewText });

    // 第三步:优化
    onProgress?.({ type: 'stage-start', stage: 'optimize', lang });
    messages.push({ role: 'assistant', content: reviewText });
    messages.push({ role: 'user', content: buildOptimizePrompt(lang) });
    let acc3 = '';
    const r3 = await chat({
      model: settings.primaryModel,
      messages,
      temperature: 0.3,
      maxTokens: 4096,
      signal,
      onStream: (c) => {
        acc3 += c;
        onProgress?.({ type: 'stream', stage: 'optimize', lang, text: c });
      },
    });
    const optimizedText = r3.text || acc3;
    final[lang] = optimizedText;
    onProgress?.({ type: 'stage-end', stage: 'optimize', lang, text: optimizedText });
  });

  await Promise.all(tasks);

  return {
    final,
    intermediate: { initial, selfReviewLog },
    meta: {
      mode: 'single',
      startedAt,
      finishedAt: Date.now(),
      durationMs: Date.now() - startedAt,
      modelsUsed: [settings.primaryModel],
    },
  };
}
