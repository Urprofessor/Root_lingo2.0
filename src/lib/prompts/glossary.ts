// ============================================================
// 术语库 Prompt 注入
// ============================================================

import type { GlossaryTerm } from '@/types';

/**
 * 把命中的术语整理成 prompt 段落
 *
 * @param matched  扫描原文后命中的术语条目
 * @param targetLang  目标语言 id
 */
export function buildGlossaryPrompt(matched: GlossaryTerm[], targetLang: string): string {
  if (matched.length === 0) return '';

  const lines: string[] = [];
  lines.push('术语库(必须严格遵循,术语在目标语言中的固定译法如下):');

  for (const term of matched) {
    const translation = term.translations[targetLang];
    if (!translation) continue;

    let line = `- "${term.source}" → "${translation}"`;

    // 禁用词(同义但不允许使用的表达)
    if (term.banned && term.banned.length > 0) {
      line += ` | 不要使用: ${term.banned.map((b) => `"${b}"`).join(', ')}`;
    }

    // 禁忌词(目标语言的文化禁忌)
    if (term.taboo && term.taboo[targetLang]) {
      line += ` | 注意: ${term.taboo[targetLang]}`;
    }

    // 备注(如保留不译、大小写规则等)
    if (term.notes) {
      line += ` | 备注: ${term.notes}`;
    }

    lines.push(line);
  }

  if (lines.length === 1) return '';
  return lines.join('\n');
}
