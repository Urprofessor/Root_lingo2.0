/**
 * PDF 解析 - 浏览器内,用 pdfjs-dist
 *
 * 注意:pdfjs-dist 需要 worker。我们用 legacy 入口规避 worker 配置麻烦。
 */
export async function parsePdf(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

  // 用 CDN worker - pdfjs 在浏览器里要 worker 才能解码
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  const allText: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = (content.items as Array<{ str: string }>)
      .map((item) => item.str)
      .join(' ');
    allText.push(text);
  }

  return allText.join('\n\n');
}
