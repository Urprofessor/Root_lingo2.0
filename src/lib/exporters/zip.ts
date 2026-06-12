import { saveAs } from 'file-saver';
import { buildTxtBlob, buildMdBlob } from './txt';
import { buildDocxBlob, buildDocxBlobFromStructured } from './docx';
import type { DocxStructured } from '@/types';

export type ZipFormat = 'txt' | 'md' | 'docx';

export interface ExportZipOptions {
  perLangText: Record<string, string>;
  format?: ZipFormat;
  /**
   * 文件名前缀(不含语言/扩展名)。默认 'translation'。
   * 例如 baseName='产品手册' + lang='en' + format='docx' → '产品手册-en.docx'
   */
  baseName?: string;
  /** zip 文件本身的命名(不含 .zip 后缀) */
  zipName?: string;
  /** docx 专用:原 docx 的结构化数据,用于保留格式 */
  docxStructured?: DocxStructured;
}

/**
 * 把多语言译文打包成 zip
 *
 * 每个文件命名:{baseName}-{lang}.{ext}
 * 例如 {产品手册}-{en}.docx
 */
export async function exportZip(opts: ExportZipOptions): Promise<void> {
  const {
    perLangText,
    format = 'md',
    baseName = 'translation',
    zipName,
    docxStructured,
  } = opts;

  const JSZipMod = (await import('jszip')).default;
  const zip = new JSZipMod();

  for (const [lang, text] of Object.entries(perLangText)) {
    if (!text) continue;
    const fileName = `${baseName}-${lang}`;

    if (format === 'txt') {
      zip.file(`${fileName}.txt`, buildTxtBlob(text));
    } else if (format === 'md') {
      zip.file(`${fileName}.md`, buildMdBlob(text));
    } else if (format === 'docx') {
      const docxBlob = docxStructured
        ? await buildDocxBlobFromStructured(docxStructured, text)
        : await buildDocxBlob(text);
      zip.file(`${fileName}.docx`, docxBlob);
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${zipName || `${baseName}-translations`}.zip`);
}
