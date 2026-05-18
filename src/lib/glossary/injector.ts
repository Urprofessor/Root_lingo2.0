import type { Glossary, GlossaryTerm } from '@/types';

/**
 * 在原文中扫描术语库,返回命中的术语条目
 *
 * 匹配策略:
 * - 大小写不敏感
 * - 整词匹配(避免 "Pump" 错配到 "Pumpkin")
 * - 命中后去重,按长度倒序排列(更长的术语优先,处理"M5 Wearable Pump"和"Pump"嵌套)
 */
export function matchGlossaryTerms(sourceText: string, glossary: Glossary): GlossaryTerm[] {
  if (!glossary || !glossary.terms || glossary.terms.length === 0) return [];
  if (!sourceText) return [];

  const text = sourceText.toLowerCase();
  const matched = new Map<string, GlossaryTerm>();

  for (const term of glossary.terms) {
    const src = term.source;
    if (!src) continue;
    const needle = src.toLowerCase();

    // 整词匹配:用边界判断
    if (containsAsWord(text, needle)) {
      if (!matched.has(src)) matched.set(src, term);
    }
  }

  // 按长度倒序 — 更长的优先
  return Array.from(matched.values()).sort((a, b) => b.source.length - a.source.length);
}

/**
 * 检查 text 中是否以"词"的形式包含 needle
 *
 * 因为中文没有空格,所以对纯英文术语做边界判断,对含中文/Unicode 的直接 includes
 */
function containsAsWord(text: string, needle: string): boolean {
  // 含 ASCII 之外的字符 → 直接子串匹配
  if (!/^[\x20-\x7e]+$/.test(needle)) {
    return text.includes(needle);
  }
  // 纯 ASCII → 整词匹配(转义正则特殊字符)
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(^|[^a-z0-9_])${escaped}([^a-z0-9_]|$)`, 'i');
  return re.test(text);
}
