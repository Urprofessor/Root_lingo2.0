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

// 把 xlsx 库返回的 unknown 值规整为联合类型,避免 TS 推断成 {} | null
function normalizeRaw(v: unknown): string | number | boolean | Date | null {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return v;
  if (v instanceof Date) return v;
  return String(v);
}

function toCell(cell: XlsxCell | undefined): ExcelCell {
  if (!cell || cell.v === undefined || cell.v === null || cell.v === '') {
    if (cell?.f) {
      return { raw: normalizeRaw(cell.v), type: 'formula', formula: cell.f };
    }
    return { raw: null, type: 'empty' };
  }
  // 公式优先识别
  if (cell.f) {
    return { raw: normalizeRaw(cell.v), type: 'formula', formula: cell.f };
  }
  let type: ExcelCellType;
  let raw: ExcelCell['raw'];
  switch (cell.t) {
    case 's':
      type = 'string';
      raw = typeof cell.v === 'string' ? cell.v : String(cell.v);
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

// A -> 0, Z -> 25, AA -> 26, TU -> 540;非法字母返回 -1
export function letterToColIndex(letter: string): number {
  const s = letter.trim().toUpperCase();
  if (!s) return -1;
  let n = 0;
  for (const c of s) {
    if (c < 'A' || c > 'Z') return -1;
    n = n * 26 + (c.charCodeAt(0) - 64);
  }
  return n - 1;
}

/**
 * 解析列字母字符串,如 "A, C, E-G, TU"
 * 返回 0-based 列索引数组(已去重并按 maxCol 过滤,无效区间静默跳过)
 */
export function parseColumnSpec(spec: string, maxCol: number): number[] {
  const set = new Set<number>();
  for (const raw of spec.split(/[,\s\n]+/)) {
    const token = raw.trim();
    if (!token) continue;
    const dashIdx = token.indexOf('-');
    if (dashIdx > 0) {
      const a = letterToColIndex(token.slice(0, dashIdx));
      const b = letterToColIndex(token.slice(dashIdx + 1));
      if (a < 0 || b < 0) continue;
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      for (let i = lo; i <= hi; i++) {
        if (i >= 0 && i < maxCol) set.add(i);
      }
    } else {
      const i = letterToColIndex(token);
      if (i >= 0 && i < maxCol) set.add(i);
    }
  }
  return Array.from(set).sort((a, b) => a - b);
}

/**
 * 解析行号字符串(1-based,如用户在 Excel 看到的),如 "1, 5, 10-15"
 * 返回 0-based 行索引数组
 */
export function parseRowSpec(spec: string, maxRow: number): number[] {
  const set = new Set<number>();
  for (const raw of spec.split(/[,\s\n]+/)) {
    const token = raw.trim();
    if (!token) continue;
    const dashIdx = token.indexOf('-');
    if (dashIdx > 0) {
      const a = Number(token.slice(0, dashIdx));
      const b = Number(token.slice(dashIdx + 1));
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
      const lo = Math.min(a, b) - 1;
      const hi = Math.max(a, b) - 1;
      for (let i = lo; i <= hi; i++) {
        if (i >= 0 && i < maxRow) set.add(i);
      }
    } else {
      const i = Number(token) - 1;
      if (Number.isFinite(i) && i >= 0 && i < maxRow) set.add(i);
    }
  }
  return Array.from(set).sort((a, b) => a - b);
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
