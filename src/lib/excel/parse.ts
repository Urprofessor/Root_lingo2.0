// ============================================================
// 结构化 Excel 解析 — 保留单元格类型、坐标、公式
// ============================================================
import type {
  ExcelWorkbookData,
  ExcelSheetData,
  ExcelCell,
  ExcelCellType,
} from '@/types/excel';

type XlsxCell = {
  t?: string;
  v?: unknown;
  f?: string;
  w?: string;
};

export async function parseExcelFile(file: File): Promise<ExcelWorkbookData> {
  const XLSX = await import('xlsx');
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true, cellFormula: true });

  const sheets: ExcelSheetData[] = [];
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const ref = ws?.['!ref'];
    if (!ref) {
      sheets.push({ name, rows: [], colCount: 0, rowCount: 0 });
      continue;
    }
    const range = XLSX.utils.decode_range(ref);
    const rowCount = range.e.r + 1;
    const colCount = range.e.c + 1;
    const rows: ExcelCell[][] = [];
    for (let r = 0; r < rowCount; r++) {
      const row: ExcelCell[] = [];
      for (let c = 0; c < colCount; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = ws[addr] as XlsxCell | undefined;
        row.push(toCell(cell));
      }
      rows.push(row);
    }
    sheets.push({ name, rows, colCount, rowCount });
  }
  return { fileName: file.name, sheets };
}

function toCell(cell: XlsxCell | undefined): ExcelCell {
  if (!cell || cell.v === undefined || cell.v === null || cell.v === '') {
    if (cell?.f) {
      return { raw: cell.v ?? null, type: 'formula', formula: cell.f };
    }
    return { raw: null, type: 'empty' };
  }
  // 公式优先识别
  if (cell.f) {
    return { raw: cell.v ?? null, type: 'formula', formula: cell.f };
  }
  let type: ExcelCellType;
  let raw: ExcelCell['raw'];
  switch (cell.t) {
    case 's':
      type = 'string';
      raw = String(cell.v ?? '');
      break;
    case 'n':
      type = 'number';
      raw = typeof cell.v === 'number' ? cell.v : Number(cell.v);
      break;
    case 'b':
      type = 'boolean';
      raw = !!cell.v;
      break;
    case 'd':
      type = 'date';
      raw = cell.v instanceof Date ? cell.v : new Date(String(cell.v));
      break;
    default:
      // 兜底:有值就当字符串
      type = 'string';
      raw = String(cell.v);
  }
  return { raw, type };
}

// 0 -> A, 25 -> Z, 26 -> AA
export function colIndexToLetter(i: number): string {
  let s = '';
  let n = i;
  while (n >= 0) {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

// 单元格的"展示字符串"(用于预览 / 翻译前的文本提取)
export function cellDisplay(cell: ExcelCell): string {
  if (cell.type === 'empty' || cell.raw == null) return '';
  if (cell.type === 'date' && cell.raw instanceof Date) {
    return cell.raw.toISOString().slice(0, 10);
  }
  if (cell.type === 'boolean') return cell.raw ? 'TRUE' : 'FALSE';
  return String(cell.raw);
}
