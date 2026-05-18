import { chat } from '@/lib/llm/chat';
import { buildSystemPrompt } from '@/lib/prompts/builder';
import { loadGlossary } from '@/lib/glossary/loader';
import type { WorkflowContext, WorkflowResult } from './types';

/**
 * Quick:每个目标语言并发跑一次翻译,直接输出。
 */
export async function quickWorkflow(ctx: WorkflowContext): Promise<WorkflowResult> {
  const { sourceText, settings, signal, onProgress } = ctx;
  const startedAt = Date.now();
  const glossary = loadGlossary(settings.glossaryId);

  const final: Record<string, string> = {};
  const tasks = settings.targetLanguages.map(async (lang) => {
    onProgress?.({ type: 'stage-start', stage: 'translate', lang });

    const systemPrompt = buildSystemPrompt({
      settings,
      glossary,
      sourceText,
      targetLang: lang,
    });

    let acc = '';
    const resp = await chat({
      model: settings.primaryModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: sourceText },
      ],
      temperature: 0.3,
      maxTokens: 4096,
      signal,
      onStream: (chunk) => {
        acc += chunk;
        onProgress?.({ type: 'stream', stage: 'translate', lang, text: chunk });
      },
    });

    final[lang] = resp.text || acc;
    onProgress?.({ type: 'stage-end', stage: 'translate', lang, text: final[lang] });
  });

  await Promise.all(tasks);

  return {
    final,
    meta: {
      mode: 'quick',
      startedAt,
      finishedAt: Date.now(),
      durationMs: Date.now() - startedAt,
      modelsUsed: [settings.primaryModel],
    },
  };
}
