import { chat } from '@/lib/llm/chat';
import {
  buildSystemPrompt,
  buildJudgePrompt,
  extractFinalFromJudge,
} from '@/lib/prompts/builder';
import { loadGlossary } from '@/lib/glossary/loader';
import { getModelLabel } from '@/lib/utils/models';
import type { WorkflowContext, WorkflowResult } from './types';

/**
 * Multi:两个模型并发翻译,然后裁判模型评估融合
 */
export async function multiWorkflow(ctx: WorkflowContext): Promise<WorkflowResult> {
  const { sourceText, settings, signal, onProgress } = ctx;
  const startedAt = Date.now();
  const glossary = loadGlossary(settings.glossaryId);

  const modelA = settings.primaryModel;
  const modelB = settings.secondaryModel || settings.primaryModel;
  const judge = settings.judgeModel || settings.primaryModel;

  const A: Record<string, string> = {};
  const B: Record<string, string> = {};
  const judgeReport: Record<string, string> = {};
  const final: Record<string, string> = {};

  const tasks = settings.targetLanguages.map(async (lang) => {
    const sysA = buildSystemPrompt({ settings, glossary, sourceText, targetLang: lang });

    const [resA, resB] = await Promise.all([
      (async () => {
        onProgress?.({ type: 'stage-start', stage: 'translate-a', lang });
        let acc = '';
        const r = await chat({
          model: modelA,
          messages: [
            { role: 'system', content: sysA },
            { role: 'user', content: sourceText },
          ],
          temperature: 0.3,
          maxTokens: 4096,
          signal,
          onStream: (c) => {
            acc += c;
            onProgress?.({ type: 'stream', stage: 'translate-a', lang, text: c });
          },
        });
        const text = r.text || acc;
        onProgress?.({ type: 'stage-end', stage: 'translate-a', lang, text });
        return text;
      })(),
      (async () => {
        onProgress?.({ type: 'stage-start', stage: 'translate-b', lang });
        let acc = '';
        const r = await chat({
          model: modelB,
          messages: [
            { role: 'system', content: sysA },
            { role: 'user', content: sourceText },
          ],
          temperature: 0.5,
          maxTokens: 4096,
          signal,
          onStream: (c) => {
            acc += c;
            onProgress?.({ type: 'stream', stage: 'translate-b', lang, text: c });
          },
        });
        const text = r.text || acc;
        onProgress?.({ type: 'stage-end', stage: 'translate-b', lang, text });
        return text;
      })(),
    ]);

    A[lang] = resA;
    B[lang] = resB;

    onProgress?.({ type: 'stage-start', stage: 'judge', lang });
    const judgePrompt = buildJudgePrompt({
      sourceText,
      translationA: resA,
      translationB: resB,
      targetLang: lang,
      modelALabel: getModelLabel(modelA),
      modelBLabel: getModelLabel(modelB),
    });
    let accJ = '';
    const rJ = await chat({
      model: judge,
      messages: [
        { role: 'system', content: '你是一名严格而专业的翻译评审员。' },
        { role: 'user', content: judgePrompt },
      ],
      temperature: 0.3,
      maxTokens: 4096,
      signal,
      onStream: (c) => {
        accJ += c;
        onProgress?.({ type: 'stream', stage: 'judge', lang, text: c });
      },
    });
    const judgeText = rJ.text || accJ;
    judgeReport[lang] = judgeText;
    final[lang] = extractFinalFromJudge(judgeText);
    onProgress?.({ type: 'stage-end', stage: 'judge', lang, text: judgeText });
  });

  await Promise.all(tasks);

  return {
    final,
    intermediate: { A, B, judgeReport },
    meta: {
      mode: 'multi',
      startedAt,
      finishedAt: Date.now(),
      durationMs: Date.now() - startedAt,
      modelsUsed: [modelA, modelB, judge],
    },
  };
}
