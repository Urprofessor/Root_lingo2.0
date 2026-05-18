import { saveAs } from 'file-saver';

export function exportTxt(text: string, filename: string): void {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, filename.endsWith('.txt') ? filename : `${filename}.txt`);
}

export function exportMarkdown(text: string, filename: string): void {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  saveAs(blob, filename.endsWith('.md') ? filename : `${filename}.md`);
}

export function buildTxtBlob(text: string): Blob {
  return new Blob([text], { type: 'text/plain;charset=utf-8' });
}

export function buildMdBlob(text: string): Blob {
  return new Blob([text], { type: 'text/markdown;charset=utf-8' });
}
