import { saveAs } from 'file-saver';
import type { DocxStructured } from '@/types';
import type JSZip from 'jszip';

export async function exportDocx(
  text: string,
  filename: string,
  structured?: DocxStructured
): Promise<void> {
  const blob = structured
    ? await buildDocxBlobFromStructured(structured, text)
    : await buildDocxBlob(text);
  saveAs(blob, filename.endsWith('.docx') ? filename : `${filename}.docx`);
}

/**
 * 没有原结构时的兜底实现:把文本按行拆成段落,生成全新 docx(无样式)
 */
export async function buildDocxBlob(text: string): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun } = await import('docx');

  const paragraphs = text.split('\n').map(
    (line) =>
      new Paragraph({
        children: [new TextRun({ text: line, size: 22 })],
      })
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs.length > 0 ? paragraphs : [new Paragraph({})],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * 结构化导出:把译文按 \n\n 拆段,塞回原 docx 的对应段落,样式 100% 保留
 *
 * 对齐策略:
 *   - 只把有文本的段落(hasText=true)作为可替换目标
 *   - 译文段数 == 原文有文本段数 → 一一对齐
 *   - 译文段数 < 原文 → 末尾原文段保留
 *   - 译文段数 > 原文 → 把多出来的合并到最后一段
 */
export async function buildDocxBlobFromStructured(
  structured: DocxStructured,
  translatedText: string
): Promise<Blob> {
  // 重新克隆 zip(避免污染原 zip,以便用户可以再次导出别的语言)
  const JSZipMod = (await import('jszip')).default;
  const originalZip = structured.zip as JSZip;
  const zipBuffer = await originalZip.generateAsync({ type: 'uint8array' });
  const zip = await JSZipMod.loadAsync(zipBuffer);

  const parser = new DOMParser();
  const doc = parser.parseFromString(structured.documentXml, 'application/xml');

  // 找出所有 <w:p>,与解析时同序
  const pElements = Array.from(doc.getElementsByTagName('w:p'));

  // 译文按空行拆段(连续的多空行算一个分隔)
  const translatedParas = translatedText
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // 把"有文本"的原段落收集成一个对齐池
  const writableIdxs: number[] = [];
  for (const ref of structured.paragraphRefs) {
    if (ref.hasText) writableIdxs.push(ref.pIndex);
  }

  // 逐一把译文段塞回去
  for (let i = 0; i < writableIdxs.length; i++) {
    const pIdx = writableIdxs[i];
    const p = pElements[pIdx];
    if (!p) continue;

    let payload = (translatedParas[i] ?? '').trim();
    // 译文多余时,把所有剩余段合并到最后一个原段
    if (i === writableIdxs.length - 1 && translatedParas.length > writableIdxs.length) {
      payload = translatedParas.slice(i).join('\n');
    }

    // 没对应的译文段(译文段数 < 原文段数) → 保留原段不动,不要清空
    if (!payload) continue;

    replaceParagraphText(p, payload);
  }

  // 序列化回 XML
  const serializer = new XMLSerializer();
  let newXml = serializer.serializeToString(doc);
  if (!newXml.startsWith('<?xml')) {
    newXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n${newXml}`;
  }

  zip.file('word/document.xml', newXml);

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

/**
 * 把段落内所有 <w:t> 的文本替换 ——
 *   - 第一个 <w:t> 放整段译文
 *   - 其余 <w:t> 清空(段落级样式保留;段落内的局部加粗/斜体跟着第一个 run 走)
 *
 * 译文里如果含换行(用户译文有 \n),保留为 <w:br/>,避免被吃掉。
 */
function replaceParagraphText(p: Element, translated: string): void {
  const tNodes = Array.from(p.getElementsByTagName('w:t'));
  if (tNodes.length === 0) return;

  // 处理换行:有 \n 时插入 <w:br/>
  const firstT = tNodes[0];
  const owner = firstT.ownerDocument!;
  const parentRun = firstT.parentNode!; // 通常是 <w:r>

  if (!translated.includes('\n')) {
    setTextContent(firstT, translated);
  } else {
    // 多段在同一 <w:p> 里(很罕见,通常发生在用户译文跨行)
    // 第一段塞到 firstT,后续段在同一个 <w:r> 内插入 <w:br/> 后跟新 <w:t>
    const segments = translated.split('\n');
    setTextContent(firstT, segments[0]);

    let insertAfter: Node = firstT;
    for (let i = 1; i < segments.length; i++) {
      const br = owner.createElementNS(
        'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
        'w:br'
      );
      const t = owner.createElementNS(
        'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
        'w:t'
      );
      t.setAttribute('xml:space', 'preserve');
      t.textContent = segments[i];
      parentRun.insertBefore(br, insertAfter.nextSibling);
      parentRun.insertBefore(t, br.nextSibling);
      insertAfter = t;
    }
  }

  // 清空段落内剩余的 <w:t>
  for (let i = 1; i < tNodes.length; i++) {
    setTextContent(tNodes[i], '');
  }
}

function setTextContent(tNode: Element, text: string): void {
  // 保留首尾空白
  tNode.setAttribute('xml:space', 'preserve');
  tNode.textContent = text;
}
