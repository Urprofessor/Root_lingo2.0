// ============================================================
// Excel 翻译编排:抽取单元格 → 逐格/批量翻译 → 写回输出 Sheet
// ============================================================
import { runWorkflow } from '@/lib/workflows';
import type { TranslationSettings } from '@/types';
import type {
  ExcelWorkbookData,
  ExcelSheetData,
  ExcelCell,
  SheetConfig,
  ApiStrategyOptions,
  OutputSheet,
  ExcelCellError,
  ExcelTranslationProgress,
} from '@/types/excel';
import { cellDisplay } from './parse';

// --- 输入 / 输出 ---
export interface TranslateRunOptions {
  workbook: ExcelWorkbookData;
  sheetConfigs: SheetConfig[]; // 顺序与 workbook.sheets 一一对应
  settings: TranslationSettings;
  apiOptions: ApiStrategyOptions;
  signal?: AbortSignal;
  onProgress?: (progress: ExcelTranslationProgress) => void;
  onError?: (err: ExcelCellError) => void;
}

export interface TranslateRunResult {
  outputSheets: OutputSheet[];
  errors: ExcelCellError[];
}

interface CellTask {
  row: number;
  col: number;
  text: string;
}

// ============================================================
// 主入口
// ============================================================
export async function runExcelTranslation(
  opts: TranslateRunOptions
): Promise<TranslateRunResult> {
  const { workbook, sheetConfigs, settings, apiOptions, signal } = opts;
  const targetLangs = settings.targetLanguages;
  const errors: ExcelCellError[] = [];

  // 先把所有"要翻译的任务"按 sheet 分组算出来
  const sheetTaskPlan: Array<{
    sheetIdx: number;
    sheet: ExcelSheetData;
    config: SheetConfig;
    tasks: CellTask[];
  }> = [];

  for (let i = 0; i < workbook.sheets.length; i++) {
    const sheet = workbook.sheets[i];
    const config = sheetConfigs[i];
    if (!config?.include) continue;
    const tasks = extractCellTasks(sheet, config);
    if (tasks.length > 0) {
      sheetTaskPlan.push({ sheetIdx: i, sheet, config, tasks });
    }
  }

  const totalCells = sheetTaskPlan.reduce((s, p) => s + p.tasks.length, 0);
  const totalUnits =
    apiOptions.strategy === 'per-cell'
      ? totalCells * targetLangs.length
      : sheetTaskPlan.reduce(
          (s, p) =>
            s +
            Math.ceil(p.tasks.length / Math.max(1, apiOptions.batchSize)) *
              targetLangs.length,
          0
        );

  let doneCells = 0;
  let doneUnits = 0;

  const emit = (currentSheet: string, currentLang: string) => {
    opts.onProgress?.({
      totalUnits,
      doneUnits,
      currentSheet,
      currentLang,
      totalCells,
      doneCells,
      errors: [...errors],
    });
  };

  emit(sheetTaskPlan[0]?.sheet.name ?? '', targetLangs[0] ?? '');

  // 翻译结果:perSheet[sheetIdx][lang] = Map<"r:c", translatedText>
  const perSheet: Array<Record<string, Map<string, string>>> = [];

  for (const plan of sheetTaskPlan) {
    if (signal?.aborted) break;
    const sheetResults: Record<string, Map<string, string>> = {};
    for (const lang of targetLangs) sheetResults[lang] = new Map();

    if (apiOptions.strategy === 'per-cell') {
      await runPerCell({
        plan,
        settings,
        targetLangs,
        concurrency: apiOptions.concurrency,
        signal,
        sheetResults,
        onCellDone: () => {
          // per-cell 模式:一格做完所有 lang 算 langs 个单元
          doneCells += 1;
          doneUnits += targetLangs.length;
          emit(plan.sheet.name, targetLangs[0]);
        },
        onError: (err) => {
          errors.push(err);
          opts.onError?.(err);
        },
      });
    } else {
      await runBatch({
        plan,
        settings,
        targetLangs,
        batchSize: apiOptions.batchSize,
        signal,
        sheetResults,
        onBatchDone: (cellsInBatch) => {
          doneCells += cellsInBatch;
          doneUnits += targetLangs.length;
          emit(plan.sheet.name, targetLangs[0]);
        },
        onError: (err) => {
          errors.push(err);
          opts.onError?.(err);
        },
      });
    }

    perSheet[plan.sheetIdx] = sheetResults;
  }

  // 组装输出 Sheet
  const outputSheets: OutputSheet[] = [];
  for (const plan of sheetTaskPlan) {
    const sheetResults = perSheet[plan.sheetIdx] || {};
    for (const lang of targetLangs) {
      const map = sheetResults[lang] || new Map<string, string>();
      const out = buildOutputSheet(plan.sheet, plan.config, lang, map);
      outputSheets.push(out);
    }
  }

  return { outputSheets, errors };
}

// ============================================================
// 抽取要翻译的单元格
// ============================================================
function extractCellTasks(sheet: ExcelSheetData, config: SheetConfig): CellTask[] {
  const tasks: CellTask[] = [];
  if (config.selectionMode === 'columns') {
    const cols = Array.from(new Set(config.selectedColumns)).sort((a, b) => a - b);
    for (let r = 0; r < sheet.rowCount; r++) {
      if (config.skipHeaderRow && r === 0) continue;
      for (const c of cols) {
        if (c < 0 || c >= sheet.colCount) continue;
        const cell = sheet.rows[r]?.[c];
        const t = cellTaskFrom(cell, r, c);
        if (t) tasks.push(t);
      }
    }
  } else {
    const rows = Array.from(new Set(config.selectedRows)).sort((a, b) => a - b);
    for (const r of rows) {
      if (r < 0 || r >= sheet.rowCount) continue;
      for (let c = 0; c < sheet.colCount; c++) {
        const cell = sheet.rows[r]?.[c];
        const t = cellTaskFrom(cell, r, c);
        if (t) tasks.push(t);
      }
    }
  }
  return tasks;
}

function cellTaskFrom(cell: ExcelCell | undefined, r: number, c: number): CellTask | null {
  if (!cell) return null;
  // 只翻译字符串类单元格;数字 / 日期 / 公式 / 布尔 / 空 → 跳过
  if (cell.type !== 'string') return null;
  const text = cellDisplay(cell).trim();
  if (!text) return null;
  return { row: r, col: c, text };
}

// ============================================================
// per-cell 模式:并发跑 N 个 cell;每个 cell 一次 runWorkflow → 所有 lang 一起出
// ============================================================
async function runPerCell(args: {
  plan: { sheet: ExcelSheetData; config: SheetConfig; tasks: CellTask[] };
  settings: TranslationSettings;
  targetLangs: string[];
  concurrency: number;
  signal?: AbortSignal;
  sheetResults: Record<string, Map<string, string>>;
  onCellDone: () => void;
  onError: (err: ExcelCellError) => void;
}) {
  const { plan, settings, targetLangs, signal, sheetResults, onCellDone, onError } = args;
  const concurrency = Math.max(1, Math.min(8, args.concurrency || 3));

  let nextIdx = 0;
  const workers: Promise<void>[] = [];
  for (let w = 0; w < concurrency; w++) {
    workers.push(
      (async () => {
        while (true) {
          if (signal?.aborted) return;
          const i = nextIdx++;
          if (i >= plan.tasks.length) return;
          const task = plan.tasks[i];
          try {
            const result = await runWorkflow({
              sourceText: task.text,
              settings,
              signal,
            });
            for (const lang of targetLangs) {
              const translated = (result.final[lang] || '').trim();
              if (translated) {
                sheetResults[lang].set(`${task.row}:${task.col}`, translated);
              } else {
                onError({
                  sheetName: plan.sheet.name,
                  lang,
                  row: task.row,
                  col: task.col,
                  message: '模型返回空译文',
                });
              }
            }
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            for (const lang of targetLangs) {
              onError({
                sheetName: plan.sheet.name,
                lang,
                row: task.row,
                col: task.col,
                message: msg,
              });
            }
          }
          onCellDone();
        }
      })()
    );
  }
  await Promise.all(workers);
}

// ============================================================
// batch 模式:每批 N 格,一次 runWorkflow,解析编号回填
// ============================================================
async function runBatch(args: {
  plan: { sheet: ExcelSheetData; config: SheetConfig; tasks: CellTask[] };
  settings: TranslationSettings;
  targetLangs: string[];
  batchSize: number;
  signal?: AbortSignal;
  sheetResults: Record<string, Map<string, string>>;
  onBatchDone: (cellsInBatch: number) => void;
  onError: (err: ExcelCellError) => void;
}) {
  const { plan, settings, targetLangs, signal, sheetResults, onBatchDone, onError } = args;
  const size = Math.max(2, Math.min(50, args.batchSize || 20));

  for (let i = 0; i < plan.tasks.length; i += size) {
    if (signal?.aborted) break;
    const batch = plan.tasks.slice(i, i + size);

    // 用编号 + 自定义需求强制保持格式
    const numbered = batch.map((t, idx) => `[${idx + 1}] ${t.text}`).join('\n');
    const batchInstruction =
      `下面是 ${batch.length} 条独立的内容,每条由 [编号] 开头。请逐条翻译,不要合并、不要省略、不要解释。\n` +
      `输出必须严格保持相同的 [编号] 前缀,每条一行,顺序与输入一致。\n` +
      `如果某一条内容很短或没有可翻译内容(例如纯符号),原样保留并保持 [编号] 前缀。`;

    const batchedSettings: TranslationSettings = {
      ...settings,
      customRequirement: [settings.customRequirement, batchInstruction]
        .filter(Boolean)
        .join('\n\n'),
    };

    try {
      const result = await runWorkflow({
        sourceText: numbered,
        settings: batchedSettings,
        signal,
      });
      for (const lang of targetLangs) {
        const raw = result.final[lang] || '';
        const parsed = parseNumberedResponse(raw, batch.length);
        for (let k = 0; k < batch.length; k++) {
          const translated = (parsed[k] || '').trim();
          const task = batch[k];
          if (translated) {
            sheetResults[lang].set(`${task.row}:${task.col}`, translated);
          } else {
            onError({
              sheetName: plan.sheet.name,
              lang,
              row: task.row,
              col: task.col,
              message: `批量解析:第 ${k + 1} 条未识别,原文将保留`,
            });
          }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      for (const lang of targetLangs) {
        for (const task of batch) {
          onError({
            sheetName: plan.sheet.name,
            lang,
            row: task.row,
            col: task.col,
            message: msg,
          });
        }
      }
    }
    onBatchDone(batch.length);
  }
}

// 解析 "[1] 内容\n[2] 内容\n..." 格式;允许编号前后多余空白
function parseNumberedResponse(text: string, expectedCount: number): string[] {
  const out: string[] = new Array(expectedCount).fill('');
  // 用 [\d+] 切分,保留前缀
  const lines = text.split(/\r?\n/);
  let current = -1;
  let buffer: string[] = [];
  const flush = () => {
    if (current >= 0 && current < expectedCount) {
      out[current] = buffer.join('\n').trim();
    }
  };
  for (const line of lines) {
    const m = line.match(/^\s*\[(\d+)\]\s*(.*)$/);
    if (m) {
      flush();
      current = Number(m[1]) - 1;
      buffer = [m[2]];
    } else if (current >= 0) {
      buffer.push(line);
    }
  }
  flush();
  return out;
}

// ============================================================
// 组装输出 Sheet
// ============================================================
function buildOutputSheet(
  source: ExcelSheetData,
  config: SheetConfig,
  lang: string,
  translations: Map<string, string>
): OutputSheet {
  const name = `${source.name}-${lang}`;

  if (config.outputMode === 'full-copy') {
    // 完整复制原 Sheet,只替换被翻译的单元格
    const rows: ExcelCell[][] = source.rows.map((row, r) =>
      row.map((cell, c) => {
        const t = translations.get(`${r}:${c}`);
        if (t !== undefined) {
          return { raw: t, type: 'string' };
        }
        return { ...cell };
      })
    );
    return { name, sourceSheetName: source.name, lang, rows };
  }

  // 'selected-only':只保留选中的列(或行),其他列(行)丢掉
  if (config.selectionMode === 'columns') {
    const cols = Array.from(new Set(config.selectedColumns)).sort((a, b) => a - b);
    const rows: ExcelCell[][] = [];
    for (let r = 0; r < source.rowCount; r++) {
      const row: ExcelCell[] = [];
      for (const c of cols) {
        if (c < 0 || c >= source.colCount) {
          row.push({ raw: null, type: 'empty' });
          continue;
        }
        // 表头行不翻译时,保留原值
        if (config.skipHeaderRow && r === 0) {
          row.push({ ...source.rows[r][c] });
          continue;
        }
        const t = translations.get(`${r}:${c}`);
        if (t !== undefined) {
          row.push({ raw: t, type: 'string' });
        } else {
          row.push({ ...source.rows[r][c] });
        }
      }
      rows.push(row);
    }
    return { name, sourceSheetName: source.name, lang, rows };
  }

  // selected-only + rows 模式
  const selRows = Array.from(new Set(config.selectedRows)).sort((a, b) => a - b);
  const rows: ExcelCell[][] = [];
  for (const r of selRows) {
    if (r < 0 || r >= source.rowCount) continue;
    const row: ExcelCell[] = [];
    for (let c = 0; c < source.colCount; c++) {
      const t = translations.get(`${r}:${c}`);
      if (t !== undefined) {
        row.push({ raw: t, type: 'string' });
      } else {
        row.push({ ...source.rows[r][c] });
      }
    }
    rows.push(row);
  }
  return { name, sourceSheetName: source.name, lang, rows };
}
