import promptsJson from '@/data/prompts.json';
import type { PromptTemplate } from '@/types/prompt';

export const ALL_PROMPTS: PromptTemplate[] = promptsJson.prompts as PromptTemplate[];

export function getPromptById(id: string): PromptTemplate | undefined {
  return ALL_PROMPTS.find((p) => p.id === id);
}

/**
 * 根据当前目标语言过滤"适用"的模板
 *
 * 规则:
 *   - 没声明 sourceLang/targetLangs 的模板 = 通用,任何场景都显示
 *   - 声明了 targetLangs 的模板,只在目标语言匹配时显示
 *   - 声明了 sourceLang 的模板,只在源语言匹配时显示
 *
 * @param targetLangs - 当前选中的目标语言数组
 * @param sourceLang  - 当前源语言 ('auto' 视作不过滤)
 */
export function filterPromptsForLangs(
  targetLangs: string[],
  sourceLang: string = 'auto'
): PromptTemplate[] {
  return ALL_PROMPTS.filter((p) => {
    // 目标语言过滤:任一目标语言命中即视为适用
    if (p.targetLangs && p.targetLangs.length > 0) {
      const hit = targetLangs.some((t) => p.targetLangs!.includes(t));
      if (!hit) return false;
    }
    // 源语言过滤
    if (p.sourceLang && sourceLang !== 'auto') {
      if (p.sourceLang !== sourceLang) return false;
    }
    return true;
  });
}

/**
 * 把多个模板的 content 拼成一个 prompt 段落
 *
 * 用于在翻译时同时启用多个模板
 */
export function combinePromptContents(ids: string[]): string {
  const parts: string[] = [];
  for (const id of ids) {
    const p = getPromptById(id);
    if (!p) continue;
    parts.push(`【${p.name}】\n\n${p.content}`);
  }
  return parts.join('\n\n---\n\n');
}
