/**
 * PPTX 解析 - 把 .pptx(本质是 zip)解压,从每页 slide XML 抽出文本
 */
export async function parsePptx(file: File): Promise<string> {
  const JSZip = (await import('jszip')).default;
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // 找出所有 slide xml
  const slideEntries = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)/)?.[1] || '0', 10);
      const nb = parseInt(b.match(/slide(\d+)/)?.[1] || '0', 10);
      return na - nb;
    });

  const allText: string[] = [];
  let idx = 1;
  for (const name of slideEntries) {
    const xml = await zip.file(name)!.async('string');
    const texts = extractTextFromXml(xml);
    allText.push(`--- Slide ${idx} ---`);
    allText.push(texts.join('\n'));
    allText.push('');
    idx++;
  }

  return allText.join('\n');
}

function extractTextFromXml(xml: string): string[] {
  // 匹配 <a:t>...</a:t> 中的文本(PPTX 的文本节点格式)
  const out: string[] = [];
  const re = /<a:t[^>]*>([\s\S]*?)<\/a:t>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    out.push(decodeXmlEntities(m[1]));
  }
  return out;
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}
