import { saveAs } from 'file-saver';
import { buildTxtBlob, buildMdBlob } from './txt';
import { buildDocxBlob } from './docx';
import { getLanguage } from '@/lib/utils/languages';

export type ZipFormat = 'txt' | 'md' | 'docx';

/**
 * 把多语言译文打包成 zip
 */
export async function exportZip(
  perLangText: Record<string, string>,
  format: ZipFormat = 'md',
  zipName = 'rootlingo-translations'
): Promise<void> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  for (const [lang, text] of Object.entries(perLangText)) {
    if (!text) continue;
    const langLabel = getLanguage(lang)?.id || lang;
    const baseName = `translation-${langLabel}`;

    if (format === 'txt') {
      zip.file(`${baseName}.txt`, buildTxtBlob(text));
    } else if (format === 'md') {
      zip.file(`${baseName}.md`, buildMdBlob(text));
    } else if (format === 'docx') {
      const docxBlob = await buildDocxBlob(text);
      zip.file(`${baseName}.docx`, docxBlob);
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${zipName}.zip`);
}
