// ============================================================
// 多 Sheet xlsx 导出
// ============================================================
import type { OutputSheet, ExcelCell } from '@/types/excel';

export async function exportMultiSheetXlsx(
  outputSheets: OutputSheet[]
): Promise<Blob> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  const usedNames = new Set<string>();
  for (const sheet of outputSheets) {
    const name = uniqueSheetName(sheet.name, usedNames);
    const aoa = toAoa(sheet.rows);
    const ws = XLSX.utils.aoa_to_sheet(aoa, { cellDates: true });
    XLSX.utils.book_append_sheet(wb, ws, name);
  }

  const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

function toAoa(
  rows: ExcelCell[][]
): Array<Array<string | number | boolean | Date | null>> {
  return rows.map((row) =>
    row.map((cell): string | number | boolean | Date | null => {
      if (cell.type === 'empty' || cell.raw == null) return null;
      return cell.raw;
    })
  );
}

// xlsx Sheet 名限制:31 字符,不能含 [ ] : * ? / \,且整个工作簿内不能重名
function uniqueSheetName(raw: string, used: Set<string>): string {
  const cleaned = raw.replace(/[\[\]:*?/\\]/g, '_').slice(0, 31);
  if (!used.has(cleaned)) {
    used.add(cleaned);
    return cleaned;
  }
  // 重名:加后缀
  for (let i = 2; i < 1000; i++) {
    const suffix = `_${i}`;
    const candidate = cleaned.slice(0, 31 - suffix.length) + suffix;
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
  }
  // 极端兜底
  const fallback = `sheet_${used.size + 1}`;
  used.add(fallback);
  return fallback;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
