import type { SrtCue } from '@/types';

export async function parseSrt(file: File): Promise<{ text: string; cues: SrtCue[] }> {
  const raw = await file.text();
  const cues = parseSrtString(raw);
  // 拼成纯文本(只取译文部分);保留 cue 用于回写
  const text = cues.map((c) => c.text).join('\n');
  return { text, cues };
}

export function parseSrtString(raw: string): SrtCue[] {
  const blocks = raw.replace(/\r/g, '').split(/\n\n+/);
  const cues: SrtCue[] = [];
  for (const block of blocks) {
    const lines = block.split('\n').filter(Boolean);
    if (lines.length < 2) continue;
    const idx = parseInt(lines[0], 10);
    if (isNaN(idx)) continue;
    const timing = lines[1];
    const timeMatch = timing.match(/(\d\d:\d\d:\d\d,\d{3})\s*-->\s*(\d\d:\d\d:\d\d,\d{3})/);
    if (!timeMatch) continue;
    const text = lines.slice(2).join('\n');
    cues.push({ index: idx, start: timeMatch[1], end: timeMatch[2], text });
  }
  return cues;
}
