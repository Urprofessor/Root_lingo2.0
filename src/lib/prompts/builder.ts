import { BASE_TRANSLATION_PROMPT } from './system';
import { SAFETY_PROMPT } from './safety';
import { buildStylePrompt } from './style';
import { buildGlossaryPrompt } from './glossary';
import { matchGlossaryTerms } from '@/lib/glossary/injector';
import type { Glossary, TranslationSettings } from '@/types';
import { getLanguageEnLabel } from '@/lib/utils/languages';

/**
 * 构建一次翻译用的完整 system prompt
 */
export function buildSystemPrompt(opts: {
  settings: TranslationSettings;
  glossary: Glossary | null;
  sourceText: string;
  targetLang: string;
}): string {
  const { settings, glossary, sourceText, targetLang } = opts;

  const parts: string[] = [BASE_TRANSLATION_PROMPT];

  // 目标语言指令
  const targetLabel = getLanguageEnLabel(targetLang);
  parts.push(`目标语言:${targetLabel} (${targetLang})。把输入文本翻译成这个语言。`);

  // 风格(仅 Single / Multi 且开关启用)
  if (settings.mode !== 'quick' && settings.styleEnabled) {
    const stylePrompt = buildStylePrompt(settings.professional, settings.warmth);
    if (stylePrompt) parts.push(stylePrompt);
  }

  // 术语库
  if (glossary && settings.glossaryId !== 'none') {
    const matched = matchGlossaryTerms(sourceText, glossary);
    const glossaryPrompt = buildGlossaryPrompt(matched, targetLang);
    if (glossaryPrompt) parts.push(glossaryPrompt);
  }

  // 安全边界
  if (settings.safetyEnabled) {
    parts.push(SAFETY_PROMPT);
  }

  // 自定义需求
  if (settings.customRequirement.trim()) {
    parts.push(`用户的额外要求:\n${settings.customRequirement.trim()}`);
  }

  // 输出格式提醒
  parts.push('请直接输出译文,不要任何前言、解释或多余的标点。');

  return parts.join('\n\n');
}

/**
 * 自审 prompt(Single 模式第二步)
 */
export function buildSelfReviewPrompt(targetLang: string): string {
  const label = getLanguageEnLabel(targetLang);
  return `你刚才输出了一段翻译。现在请扮演审校者,仔细对照原文和你的译文,找出译文中所有可以改进的地方:
- 是否忠实于原文?有无添加或省略?
- 用词是否地道、自然?
- 数字、专有名词、术语是否准确保留?
- 语气、风格是否一致?
- 标点和格式是否符合 ${label} 的规范?

请只输出审校发现的具体问题清单,每条一行,不要给出修改后的译文。如果你认为译文已经完美,输出"无需修改"。`;
}

/**
 * 优化 prompt(Single 模式第三步)
 */
export function buildOptimizePrompt(targetLang: string): string {
  const label = getLanguageEnLabel(targetLang);
  return `根据你刚才审校发现的问题,产出修订后的最终译文。要求:
- 修复所有审校时发现的问题。
- 保持原文的段落结构、列表、Markdown 标记。
- 直接输出修订后的完整译文,不要任何说明或前言。
- 用 ${label} 输出。`;
}

/**
 * 裁判 prompt(Multi 模式)
 */
export function buildJudgePrompt(opts: {
  sourceText: string;
  translationA: string;
  translationB: string;
  targetLang: string;
  modelALabel: string;
  modelBLabel: string;
}): string {
  const { sourceText, translationA, translationB, targetLang, modelALabel, modelBLabel } = opts;
  const label = getLanguageEnLabel(targetLang);

  return `你是一名资深翻译评审。请对照以下原文,评估两个模型给出的 ${label} 译文,并融合输出最佳译文。

【原文】
${sourceText}

【译文 A — ${modelALabel}】
${translationA}

【译文 B — ${modelBLabel}】
${translationB}

请按下面格式输出,严格使用三段标题:

## 评估
逐项简要点评 A 与 B 在准确性、用词、语气、结构、术语一致性方面的差异。每项不超过两句话。

## 选择
说明在每个段落或关键点上你倾向 A 还是 B,以及为什么(可以混合)。

## 最终译文
输出融合后的最终译文,这一段不要任何说明,只放干净的译文文本。`;
}

/**
 * 从裁判输出中提取"最终译文"部分
 */
export function extractFinalFromJudge(judgeOutput: string): string {
  // 兼容多种标题写法
  const patterns = [
    /## *最终译文\s*\n([\s\S]*?)$/i,
    /## *Final Translation\s*\n([\s\S]*?)$/i,
    /【最终译文】\s*\n([\s\S]*?)$/i,
  ];
  for (const pat of patterns) {
    const match = judgeOutput.match(pat);
    if (match) return match[1].trim();
  }
  // 没匹配到,退而求其次:取最后一个段落
  const segs = judgeOutput.split(/\n\s*\n/);
  return segs[segs.length - 1].trim();
}
