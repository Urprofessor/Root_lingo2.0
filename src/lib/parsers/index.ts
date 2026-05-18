import { parseTxt, parseMarkdown } from './txt';
import { parseDocx } from './docx';
import { parsePdf } from './pdf';
import { parseXlsx } from './xlsx';
import { parsePptx } from './pptx';
import { parseSrt } from './srt';
import { parseImage } from './image-ocr';
import type { InputContent } from '@/types';

const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'];

export async function parseFile(
  file: File,
  onProgress?: (p: number) => void
): Promise<InputContent> {
  const name = file.name;
  const ext = name.split('.').pop()?.toLowerCase() || '';

  if (ext === 'txt') {
    const text = await parseTxt(file);
    return { type: 'file', text, fileName: name, fileType: ext };
  }

  if (ext === 'md' || ext === 'markdown') {
    const text = await parseMarkdown(file);
    return { type: 'file', text, fileName: name, fileType: ext };
  }

  if (ext === 'docx') {
    const text = await parseDocx(file);
    return { type: 'file', text, fileName: name, fileType: ext };
  }

  if (ext === 'pdf') {
    const text = await parsePdf(file);
    return { type: 'file', text, fileName: name, fileType: ext };
  }

  if (ext === 'pptx') {
    const text = await parsePptx(file);
    return { type: 'file', text, fileName: name, fileType: ext };
  }

  if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
    const text = await parseXlsx(file);
    return { type: 'file', text, fileName: name, fileType: ext };
  }

  if (ext === 'srt') {
    const { text, cues } = await parseSrt(file);
    return { type: 'srt', text, fileName: name, fileType: ext, srtCues: cues };
  }

  if (IMAGE_EXTS.includes(ext) || file.type.startsWith('image/')) {
    const text = await parseImage(file, onProgress);
    return { type: 'image', text, fileName: name, fileType: ext };
  }

  // 兜底:当作纯文本读
  const text = await parseTxt(file);
  return { type: 'file', text, fileName: name, fileType: ext || 'unknown' };
}
