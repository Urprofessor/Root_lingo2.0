'use client';

import { create } from 'zustand';
import type {
  ExcelWorkbookData,
  SheetConfig,
  ApiStrategyOptions,
  ApiStrategy,
  OutputSheet,
  ExcelCellError,
  ExcelTranslationProgress,
  SheetSelectionMode,
  SheetOutputMode,
} from '@/types/excel';

export interface ExcelTranslationStore {
  // 输入
  workbook: ExcelWorkbookData | null;
  setWorkbook: (wb: ExcelWorkbookData | null) => void;

  // 每个 Sheet 的配置(下标与 workbook.sheets 一一对应)
  sheetConfigs: SheetConfig[];
  setSheetConfigs: (configs: SheetConfig[]) => void;
  updateSheetConfig: (idx: number, patch: Partial<SheetConfig>) => void;
  toggleSheetInclude: (idx: number) => void;
  setSelectionMode: (idx: number, mode: SheetSelectionMode) => void;
  toggleColumn: (idx: number, col: number) => void;
  toggleRow: (idx: number, row: number) => void;
  setOutputMode: (idx: number, mode: SheetOutputMode) => void;
  setSkipHeaderRow: (idx: number, skip: boolean) => void;

  // API 策略
  apiOptions: ApiStrategyOptions;
  setApiStrategy: (s: ApiStrategy) => void;
  setBatchSize: (n: number) => void;
  setConcurrency: (n: number) => void;

  // 运行态
  running: boolean;
  setRunning: (b: boolean) => void;
  progress: ExcelTranslationProgress | null;
  setProgress: (p: ExcelTranslationProgress | null) => void;
  errors: ExcelCellError[];
  setErrors: (errs: ExcelCellError[]) => void;
  outputSheets: OutputSheet[];
  setOutputSheets: (sheets: OutputSheet[]) => void;
  fatalError: string | null;
  setFatalError: (e: string | null) => void;

  // 重置(切换文件 / 再次翻译)
  resetRunState: () => void;
  resetAll: () => void;
}

const DEFAULT_API_OPTIONS: ApiStrategyOptions = {
  strategy: 'per-cell',
  batchSize: 20,
  concurrency: 3,
};

function makeDefaultConfigs(wb: ExcelWorkbookData): SheetConfig[] {
  return wb.sheets.map((s) => ({
    sheetName: s.name,
    include: true,
    selectionMode: 'columns' as SheetSelectionMode,
    selectedColumns: [],
    selectedRows: [],
    skipHeaderRow: true,
    outputMode: 'full-copy' as SheetOutputMode,
  }));
}

export const useExcelTranslation = create<ExcelTranslationStore>((set) => ({
  workbook: null,
  setWorkbook: (wb) =>
    set({
      workbook: wb,
      sheetConfigs: wb ? makeDefaultConfigs(wb) : [],
      progress: null,
      errors: [],
      outputSheets: [],
      fatalError: null,
    }),

  sheetConfigs: [],
  setSheetConfigs: (sheetConfigs) => set({ sheetConfigs }),
  updateSheetConfig: (idx, patch) =>
    set((state) => {
      const next = [...state.sheetConfigs];
      if (!next[idx]) return state;
      next[idx] = { ...next[idx], ...patch };
      return { sheetConfigs: next };
    }),
  toggleSheetInclude: (idx) =>
    set((state) => {
      const next = [...state.sheetConfigs];
      if (!next[idx]) return state;
      next[idx] = { ...next[idx], include: !next[idx].include };
      return { sheetConfigs: next };
    }),
  setSelectionMode: (idx, mode) =>
    set((state) => {
      const next = [...state.sheetConfigs];
      if (!next[idx]) return state;
      next[idx] = { ...next[idx], selectionMode: mode };
      return { sheetConfigs: next };
    }),
  toggleColumn: (idx, col) =>
    set((state) => {
      const next = [...state.sheetConfigs];
      if (!next[idx]) return state;
      const cur = next[idx].selectedColumns;
      const exists = cur.includes(col);
      next[idx] = {
        ...next[idx],
        selectedColumns: exists ? cur.filter((c) => c !== col) : [...cur, col],
      };
      return { sheetConfigs: next };
    }),
  toggleRow: (idx, row) =>
    set((state) => {
      const next = [...state.sheetConfigs];
      if (!next[idx]) return state;
      const cur = next[idx].selectedRows;
      const exists = cur.includes(row);
      next[idx] = {
        ...next[idx],
        selectedRows: exists ? cur.filter((r) => r !== row) : [...cur, row],
      };
      return { sheetConfigs: next };
    }),
  setOutputMode: (idx, mode) =>
    set((state) => {
      const next = [...state.sheetConfigs];
      if (!next[idx]) return state;
      next[idx] = { ...next[idx], outputMode: mode };
      return { sheetConfigs: next };
    }),
  setSkipHeaderRow: (idx, skip) =>
    set((state) => {
      const next = [...state.sheetConfigs];
      if (!next[idx]) return state;
      next[idx] = { ...next[idx], skipHeaderRow: skip };
      return { sheetConfigs: next };
    }),

  apiOptions: DEFAULT_API_OPTIONS,
  setApiStrategy: (s) =>
    set((state) => ({ apiOptions: { ...state.apiOptions, strategy: s } })),
  setBatchSize: (batchSize) =>
    set((state) => ({ apiOptions: { ...state.apiOptions, batchSize } })),
  setConcurrency: (concurrency) =>
    set((state) => ({ apiOptions: { ...state.apiOptions, concurrency } })),

  running: false,
  setRunning: (b) => set({ running: b }),
  progress: null,
  setProgress: (p) => set({ progress: p }),
  errors: [],
  setErrors: (errs) => set({ errors: errs }),
  outputSheets: [],
  setOutputSheets: (s) => set({ outputSheets: s }),
  fatalError: null,
  setFatalError: (e) => set({ fatalError: e }),

  resetRunState: () =>
    set({
      running: false,
      progress: null,
      errors: [],
      outputSheets: [],
      fatalError: null,
    }),
  resetAll: () =>
    set({
      workbook: null,
      sheetConfigs: [],
      running: false,
      progress: null,
      errors: [],
      outputSheets: [],
      fatalError: null,
    }),
}));
