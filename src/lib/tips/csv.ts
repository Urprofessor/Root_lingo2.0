/**
 * Tips CSV 工具 — 解析输入,清洗模型输出
 */

export interface TipInput {
  tipCode: string;
  langCode: string;
  content: string;
}

/**
 * 解析用户粘贴的 CSV 输入(无表头)
 *
 * 每行格式: tip_code,lang_code,"content"
 * 容错:
 *   - 跳过空行
 *   - 如果第一行看起来像表头(tip_code,lang_code,content)则跳过
 *   - content 可能带引号也可能不带
 */
export function parseTipsInput(raw: string): TipInput[] {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out: TipInput[] = [];

  for (const line of lines) {
    // 跳过表头
    if (/^tip_code\s*,\s*lang_code\s*,\s*content/i.test(line)) continue;

    const parsed = parseCsvLine(line);
    if (parsed.length < 3) continue;

    const tipCode = parsed[0].trim();
    const langCode = parsed[1].trim();
    // content 可能因为内部逗号被拆成多段,重新拼起来
    const content = parsed.slice(2).join(',').trim();

    if (!tipCode || !content) continue;
    out.push({ tipCode, langCode: langCode || 'en-US', content });
  }

  return out;
}

/**
 * 解析一行 CSV,处理双引号包裹和转义
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      cur += ch;
      i++;
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        fields.push(cur);
        cur = '';
        i++;
      } else {
        cur += ch;
        i++;
      }
    }
  }
  fields.push(cur);
  return fields;
}

/**
 * 清洗模型输出的 CSV
 *
 * - 去掉可能的 markdown code fence(```csv ... ```)
 * - 去掉空行
 * - 去掉可能混进来的表头行
 * - 去掉解释性文字(只保留看起来像 CSV 数据的行)
 */
export function cleanTipsOutput(raw: string): string {
  let text = raw.trim();

  // 去掉 markdown code fence
  text = text.replace(/^```[a-z]*\s*\n?/i, '').replace(/\n?```\s*$/i, '');

  const lines = text.split(/\r?\n/);
  const cleaned: string[] = [];

  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    // 跳过表头
    if (/^tip_code\s*,\s*lang_code\s*,\s*content/i.test(t)) continue;
    // 一行至少要有两个逗号才像数据行
    const commaCount = (t.match(/,/g) || []).length;
    if (commaCount < 2) continue;
    cleaned.push(t);
  }

  return cleaned.join('\n');
}

/**
 * 把一个字段按 CSV 规则包裹(只在含逗号/引号/换行时加引号)
 * content 字段强制加引号
 */
export function csvQuoteContent(s: string): string {
  const escaped = s.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * 标准 CSV 表头
 */
export const TIPS_CSV_HEADER = 'tip_code,lang_code,content';
