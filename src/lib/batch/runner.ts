// ============================================================
// 批量翻译编排:顺序处理 + 重试 + 文件间间隔
// ============================================================
import { runWorkflow } from '@/lib/workflows';
import type { TranslationSettings } from '@/types';
import type { BatchFile, BatchOptions, BatchProgress } from '@/types/batch';

export interface RunBatchOptions {
  files: BatchFile[];
  settings: TranslationSettings;
  options: BatchOptions;
  signal?: AbortSignal;
  onFileUpdate: (id: string, patch: Partial<BatchFile>) => void;
  onProgress?: (p: BatchProgress) => void;
}

/**
 * 主入口:顺序跑每个文件,文件之间间隔,失败重试
 */
export async function runBatchTranslation(opts: RunBatchOptions): Promise<void> {
  const { files, settings, options, signal, onFileUpdate, onProgress } = opts;

  // 只处理已解析的文件;跳过未解析/错误的
  const todo = files.filter((f) => f.status === 'parsed' || f.status === 'queued');
  const totalFiles = todo.length;
  let doneFiles = 0;
  let errorFiles = 0;

  const emit = (cur: BatchFile | null, retryHint?: string) => {
    onProgress?.({
      totalFiles,
      doneFiles,
      errorFiles,
      currentFileId: cur?.id ?? null,
      currentFileName: cur?.fileName ?? '',
      retryHint,
    });
  };

  emit(todo[0] ?? null);

  for (let fi = 0; fi < todo.length; fi++) {
    if (signal?.aborted) break;
    const file = todo[fi];

    if (!file.input || !file.input.text.trim()) {
      onFileUpdate(file.id, {
        status: 'error',
        translateError: '文件解析为空,无可翻译内容',
      });
      errorFiles++;
      emit(file);
      continue;
    }

    onFileUpdate(file.id, {
      status: 'translating',
      startedAt: Date.now(),
      attempts: 0,
    });
    emit(file);

    let result: Record<string, string> | null = null;
    let lastErr: string | null = null;

    for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
      if (signal?.aborted) break;
      if (attempt > 0) {
        // 指数退避:5s, 15s, 45s ...
        const waitSec = options.retryBaseSec * Math.pow(3, attempt - 1);
        onFileUpdate(file.id, {
          status: 'retrying',
          attempts: attempt,
        });
        emit(file, `第 ${attempt} 次重试将在 ${waitSec}s 后开始`);
        const waited = await interruptibleSleep(waitSec * 1000, signal);
        if (!waited) break;
        onFileUpdate(file.id, { status: 'translating', attempts: attempt });
        emit(file);
      }

      try {
        const wfResult = await runWorkflow({
          sourceText: file.input.text,
          settings,
          signal,
        });
        result = wfResult.final;
        break;
      } catch (e) {
        if (signal?.aborted) break;
        lastErr = e instanceof Error ? e.message : String(e);
      }
    }

    if (signal?.aborted) {
      onFileUpdate(file.id, { status: 'cancelled' });
      break;
    }

    if (result) {
      onFileUpdate(file.id, {
        status: 'done',
        results: result,
        finishedAt: Date.now(),
        translateError: undefined,
      });
      doneFiles++;
    } else {
      onFileUpdate(file.id, {
        status: 'error',
        translateError: lastErr || '翻译失败',
        finishedAt: Date.now(),
      });
      errorFiles++;
    }
    emit(file);

    // 文件之间间隔(最后一个文件不用等)
    if (fi < todo.length - 1 && options.delayBetweenFilesSec > 0) {
      const waited = await interruptibleSleep(
        options.delayBetweenFilesSec * 1000,
        signal
      );
      if (!waited) break;
    }
  }

  emit(null);
}

/**
 * 可被 AbortSignal 中断的 sleep
 * 返回 true 表示正常完成,false 表示被中断
 */
function interruptibleSleep(ms: number, signal?: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve(false);
      return;
    }
    const timer = setTimeout(() => resolve(true), ms);
    const onAbort = () => {
      clearTimeout(timer);
      resolve(false);
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
