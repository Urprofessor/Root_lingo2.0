/**
 * 图片 OCR — 浏览器内 tesseract.js
 *
 * 同时加载中文+英文模型,自动识别混合语言
 */
export async function parseImage(file: File, onProgress?: (p: number) => void): Promise<string> {
  const Tesseract = (await import('tesseract.js')).default;

  const result = await Tesseract.recognize(file, 'chi_sim+eng', {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text' && typeof m.progress === 'number') {
        onProgress?.(m.progress);
      }
    },
  });

  return result.data.text;
}
