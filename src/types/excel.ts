// ============================================================
// Excel 翻译 — 领域类型
// ============================================================

export type ExcelCellType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'formula'
  | 'empty';

export interface ExcelCell {
  raw: string | number | boolean | Date | null;
  type: ExcelCellType;
  formula?: string;
  // 公式单元格保留原始公式;输出时原样写回(不翻译)
}

export interface ExcelSheetData {
  name: string;
  rows: ExcelCell[][]; // rows[r][c]
  colCount: number;
  rowCount: number;
}

export interface ExcelWorkbookData {
  fileName: string;
  sheets: ExcelSheetData[];
}

// --- 单 Sheet 的翻译配置 ---
export type SheetSelectionMode = 'columns' | 'rows';

// 输出模式:完整复制原 Sheet 结构(只替换选中单元格) vs 只保留选中部分
export type SheetOutputMode = 'full-copy' | 'selected-only';

export interface SheetConfig {
  sheetName: string;
  include: boolean;            // 是否参与翻译(用户可关掉个别 Sheet)
  selectionMode: SheetSelectionMode;
  selectedColumns: number[];   // 0-based;selectionMode === 'columns' 时使用
  selectedRows: number[];      // 0-based;selectionMode === 'rows' 时使用
  skipHeaderRow: boolean;      // 列模式下,跳过第 0 行
  outputMode: SheetOutputMode;
}

// --- API 调用策略 ---
export type ApiStrategy = 'per-cell' | 'batch';

export interface ApiStrategyOptions {
  strategy: ApiStrategy;
  batchSize: number;     // batch 模式下每批多少格(默认 20)
  concurrency: number;   // 并发(默认 3)
}

// --- 进度与错误 ---
export interface ExcelCellError {
  sheetName: string;
  lang: string;
  row: number;
  col: number;
  message: string;
}

export interface ExcelTranslationProgress {
  totalUnits: number;     // 总任务单元数(per-cell 模式 = 单元格数,batch 模式 = batch 数)
  doneUnits: number;
  currentSheet: string;
  currentLang: string;
  totalCells: number;     // 总单元格数(用于显示)
  doneCells: number;
  errors: ExcelCellError[];
}

// 翻译完成后的输出 Sheet
export interface OutputSheet {
  name: string;          // 形如 "产品-en"
  sourceSheetName: string;
  lang: string;
  rows: ExcelCell[][];
}
