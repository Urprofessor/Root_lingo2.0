import type { DocxStructured } from '@/types';

export async function parseDocx(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/**
 * 结构化解析 .docx —— 同时返回:
 *   - text: 段落用 \n\n 拼接(送翻译流)
 *   - structured: 原 zip + document.xml + 段落 → 原文映射
 *
 * 用于"保留格式"导出场景:翻译后按段落对齐回原 XML,样式 100% 保留(段落级)。
 *
 * 段落定义:document.xml 里所有 <w:p> 元素(含表格里的)。
 * 文本提取:每个 <w:p> 下所有 <w:t> 的文本拼接。
 * 空段落(没有可翻文本)不进入 text 但保留在 paragraphRefs 里以维持位置对齐。
 */
export async function parseDocxStructured(
  file: File
): Promise<{ text: string; structured: DocxStructured }> {
  const JSZip = (await import('jszip')).default;
  const buf = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buf);

  const documentXml = await zip.file('word/document.xml')?.async('string');
  if (!documentXml) {
    throw new Error('docx 文件结构异常:找不到 word/document.xml');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(documentXml, 'application/xml');

  const parseErr = doc.getElementsByTagName('parsererror');
  if (parseErr.length > 0) {
    throw new Error('docx 文件 XML 解析失败');
  }

  // 找所有段落(<w:p>) ── 包括嵌在表格里的
  const pElements = Array.from(doc.getElementsByTagName('w:p'));

  const paragraphTexts: string[] = [];
  const paragraphRefs: Array<{ pIndex: number; hasText: boolean; text: string }> = [];

  for (let i = 0; i < pElements.length; i++) {
    const p = pElements[i];
    const tNodes = Array.from(p.getElementsByTagName('w:t'));
    const text = tNodes
      .map((t) => t.textContent || '')
      .join('')
      .trim();
    const hasText = text.length > 0;
    paragraphRefs.push({ pIndex: i, hasText, text });
    if (hasText) paragraphTexts.push(text);
  }

  // 段落之间用空行隔开
  const text = paragraphTexts.join('\n\n');

  return {
    text,
    structured: {
      zip,
      documentXml,
      paragraphRefs,
    },
  };
}
