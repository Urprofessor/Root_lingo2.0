'use client';

import { useRef, useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  Loader2,
  X,
  FileCheck,
  PlayCircle,
  StopCircle,
  Download,
  AlertCircle,
  Zap,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { ModeSelector } from '@/components/settings-panel/ModeSelector';
import { ModelPicker } from '@/components/settings-panel/ModelPicker';
import { LanguageMultiSelect } from '@/components/settings-panel/LanguageMultiSelect';
import { SourceLanguagePicker } from '@/components/settings-panel/SourceLanguagePicker';
import { SimpleSelect } from '@/components/ui/SimpleSelect';
import { SheetConfigCard } from './excel/SheetConfigCard';
import { useTranslationStore } from '@/store/useTranslationStore';
import { useExcelTranslation } from '@/store/useExcelTranslation';
import { parseExcelFile } from '@/lib/excel/parse';
import {
  exportMultiSheetXlsx,
  downloadBlob,
} from '@/lib/excel/export';
import { runExcelTranslation } from '@/lib/excel/translate';
import { cn } from '@/lib/utils/cn';
import { getLanguageLabel } from '@/lib/utils/languages';
import type { ApiStrategy } from '@/types/excel';

export function ExcelTranslatePage() {
  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <Header />
      <FileUploadCard />
      <SheetsConfigSection />
      <TranslationSettingsSection />
      <ApiStrategyCard />
      <RunBar />
      <OutputCard />
    </div>
  );
}

// ============================================================
// Header
// ============================================================
function Header() {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50">
        <FileSpreadsheet size={22} className="text-brand-600" />
      </div>
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink-900">
          Excel 翻译
        </h1>
        <p className="text-xs text-ink-500">
          上传 .xlsx 后选择 Sheet、列或行,输出多语言版本(每语言一个 Sheet)
        </p>
      </div>
    </div>
  );
}

// ============================================================
// 文件上传
// ============================================================
function FileUploadCard() {
  const workbook = useExcelTranslation((s) => s.workbook);
  const setWorkbook = useExcelTranslation((s) => s.setWorkbook);
  const running = useExcelTranslation((s) => s.running);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setParsing(true);
    setParseError(null);
    try {
      const wb = await parseExcelFile(file);
      if (wb.sheets.length === 0) {
        throw new Error('文件没有可读取的 Sheet');
      }
      setWorkbook(wb);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : '解析失败');
    } finally {
      setParsing(false);
    }
  }

  function clear() {
    setWorkbook(null);
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <SectionCard title="① 上传 Excel">
      <div
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => !running && fileInputRef.current?.click()}
        className={cn(
          'flex h-[160px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed bg-ink-50/40 px-6 text-center transition',
          dragOver
            ? 'border-brand-400 bg-brand-50/60'
            : 'border-ink-300 hover:border-ink-400 hover:bg-ink-50/70',
          running && 'pointer-events-none opacity-50'
        )}
      >
        {parsing ? (
          <>
            <Loader2 size={26} className="mb-2 animate-spin text-brand-500" />
            <p className="text-sm font-medium text-ink-700">正在解析 Excel……</p>
          </>
        ) : workbook ? (
          <>
            <FileCheck size={26} className="mb-2 text-brand-500" />
            <p className="mb-1 text-sm font-medium text-ink-900">
              {workbook.fileName}
            </p>
            <p className="text-[11px] text-ink-500">
              共 {workbook.sheets.length} 个 Sheet
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                clear();
              }}
              className="mt-3 inline-flex items-center gap-1 rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <X size={11} /> 重新上传
            </button>
          </>
        ) : (
          <>
            <UploadCloud size={26} className="mb-2 text-ink-400" />
            <p className="text-sm font-medium text-ink-700">
              拖入 .xlsx 文件或点击选择
            </p>
            <p className="mt-1 text-[11px] text-ink-400">
              文件不会上传到任何服务器,所有解析在浏览器内完成
            </p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
          className="hidden"
        />
      </div>
      {parseError && (
        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs text-red-700">
          {parseError}
        </div>
      )}
    </SectionCard>
  );
}

// ============================================================
// 每 Sheet 配置
// ============================================================
function SheetsConfigSection() {
  const workbook = useExcelTranslation((s) => s.workbook);
  const sheetConfigs = useExcelTranslation((s) => s.sheetConfigs);
  const toggleInclude = useExcelTranslation((s) => s.toggleSheetInclude);
  const setSelectionMode = useExcelTranslation((s) => s.setSelectionMode);
  const toggleColumn = useExcelTranslation((s) => s.toggleColumn);
  const toggleRow = useExcelTranslation((s) => s.toggleRow);
  const setSkipHeaderRow = useExcelTranslation((s) => s.setSkipHeaderRow);
  const setOutputMode = useExcelTranslation((s) => s.setOutputMode);

  if (!workbook) return null;

  return (
    <SectionCard title="② 配置每个 Sheet">
      <div className="space-y-3">
        {workbook.sheets.map((sheet, i) => (
          <SheetConfigCard
            key={`${sheet.name}-${i}`}
            sheet={sheet}
            config={sheetConfigs[i]}
            index={i}
            onToggleInclude={() => toggleInclude(i)}
            onSelectionModeChange={(m) => setSelectionMode(i, m)}
            onToggleColumn={(c) => toggleColumn(i, c)}
            onToggleRow={(r) => toggleRow(i, r)}
            onSkipHeaderChange={(s) => setSkipHeaderRow(i, s)}
            onOutputModeChange={(m) => setOutputMode(i, m)}
          />
        ))}
      </div>
    </SectionCard>
  );
}

// ============================================================
// 翻译设置(复用主翻译 store)
// ============================================================
function TranslationSettingsSection() {
  const workbook = useExcelTranslation((s) => s.workbook);
  const settings = useTranslationStore((s) => s.settings);
  const setMode = useTranslationStore((s) => s.setMode);
  const setSourceLanguage = useTranslationStore((s) => s.setSourceLanguage);
  const setTargetLanguages = useTranslationStore((s) => s.setTargetLanguages);
  const toggleTargetLanguage = useTranslationStore((s) => s.toggleTargetLanguage);
  const setPrimaryModel = useTranslationStore((s) => s.setPrimaryModel);
  const setSecondaryModel = useTranslationStore((s) => s.setSecondaryModel);
  const setJudgeModel = useTranslationStore((s) => s.setJudgeModel);
  const setGlossaryId = useTranslationStore((s) => s.setGlossaryId);
  const setCustomRequirement = useTranslationStore((s) => s.setCustomRequirement);

  if (!workbook) return null;

  const isMulti = settings.mode === 'multi';

  return (
    <SectionCard title="③ 翻译设置">
      <p className="mb-3 text-[11px] text-ink-500">
        这里的设置与"工作台"共享,改了两边都会同步。
      </p>

      <div className="mb-4">
        <p className="mb-2 text-[11px] font-medium text-ink-500">工作模式</p>
        <ModeSelector value={settings.mode} onChange={setMode} />
      </div>

      <div className="mb-4 space-y-3">
        <ModelPicker
          label={isMulti ? '翻译模型 A' : '翻译模型'}
          value={settings.primaryModel}
          onChange={setPrimaryModel}
        />
        {isMulti && (
          <>
            <ModelPicker
              label="翻译模型 B"
              value={settings.secondaryModel || settings.primaryModel}
              onChange={setSecondaryModel}
            />
            <ModelPicker
              label="裁判模型"
              value={settings.judgeModel || settings.primaryModel}
              onChange={setJudgeModel}
            />
          </>
        )}
      </div>

      <div className="mb-4 grid grid-cols-[1fr_1.2fr] items-end gap-3">
        <SourceLanguagePicker
          value={settings.sourceLanguage}
          onChange={setSourceLanguage}
        />
        <LanguageMultiSelect
          label="目标语言"
          selected={settings.targetLanguages}
          onToggle={toggleTargetLanguage}
          onChange={setTargetLanguages}
        />
      </div>

      <div className="mb-4">
        <SimpleSelect
          label="术语库"
          value={settings.glossaryId}
          onChange={setGlossaryId}
          options={[
            {
              id: 'momcozy',
              label: 'Momcozy 全球术语库',
              description: '704 条 · 母婴产品 · V1.0',
            },
            { id: 'none', label: '不使用', description: '不注入任何术语约束' },
          ]}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-medium text-ink-500">
          自定义需求(可选)
        </label>
        <textarea
          value={settings.customRequirement}
          onChange={(e) => setCustomRequirement(e.target.value)}
          placeholder="如:保持产品规格的精确性 / 避免口语化表达……"
          className="h-20 w-full resize-none rounded-2xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm leading-5 text-ink-800 outline-none placeholder:text-ink-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
      </div>
    </SectionCard>
  );
}

// ============================================================
// API 策略
// ============================================================
function ApiStrategyCard() {
  const workbook = useExcelTranslation((s) => s.workbook);
  const apiOptions = useExcelTranslation((s) => s.apiOptions);
  const setApiStrategy = useExcelTranslation((s) => s.setApiStrategy);
  const setBatchSize = useExcelTranslation((s) => s.setBatchSize);
  const setConcurrency = useExcelTranslation((s) => s.setConcurrency);

  if (!workbook) return null;

  const isPerCell = apiOptions.strategy === 'per-cell';

  return (
    <SectionCard title="④ API 调用策略">
      <div className="mb-3 grid grid-cols-2 gap-2">
        <StrategyBtn
          active={isPerCell}
          onClick={() => setApiStrategy('per-cell' as ApiStrategy)}
          icon={<Layers size={14} />}
          label="逐格调用"
          hint="每个单元格独立翻译 · 准确率高 · 慢且费 token"
        />
        <StrategyBtn
          active={!isPerCell}
          onClick={() => setApiStrategy('batch' as ApiStrategy)}
          icon={<Zap size={14} />}
          label="批量打包"
          hint="多格合并一次调用 · 快且省 token · 偶发对齐风险"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {!isPerCell && (
          <NumberInput
            label="每批单元格数"
            value={apiOptions.batchSize}
            min={2}
            max={50}
            onChange={setBatchSize}
            hint="2-50,默认 20"
          />
        )}
        {isPerCell && (
          <NumberInput
            label="并发数"
            value={apiOptions.concurrency}
            min={1}
            max={8}
            onChange={setConcurrency}
            hint="1-8,默认 3"
          />
        )}
      </div>
    </SectionCard>
  );
}

function StrategyBtn({
  active,
  onClick,
  icon,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-2xl border px-3.5 py-3 text-left transition',
        active
          ? 'border-brand-400 bg-brand-50/60 shadow-[0_2px_8px_rgba(52,199,89,0.18)]'
          : 'border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50/60'
      )}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <span className={active ? 'text-brand-600' : 'text-ink-500'}>{icon}</span>
        <span
          className={cn(
            'text-sm font-semibold',
            active ? 'text-brand-700' : 'text-ink-900'
          )}
        >
          {label}
        </span>
      </div>
      <p className="text-[11px] leading-4 text-ink-500">{hint}</p>
    </button>
  );
}

function NumberInput({
  label,
  value,
  min,
  max,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-medium text-ink-500">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, n)));
        }}
        className="h-10 w-full rounded-2xl border border-ink-200 bg-white px-3.5 text-sm font-medium text-ink-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
      />
      {hint && <p className="mt-1 text-[10px] text-ink-400">{hint}</p>}
    </div>
  );
}

// ============================================================
// 运行栏
// ============================================================
function RunBar() {
  const workbook = useExcelTranslation((s) => s.workbook);
  const sheetConfigs = useExcelTranslation((s) => s.sheetConfigs);
  const apiOptions = useExcelTranslation((s) => s.apiOptions);
  const running = useExcelTranslation((s) => s.running);
  const setRunning = useExcelTranslation((s) => s.setRunning);
  const progress = useExcelTranslation((s) => s.progress);
  const setProgress = useExcelTranslation((s) => s.setProgress);
  const setErrors = useExcelTranslation((s) => s.setErrors);
  const setOutputSheets = useExcelTranslation((s) => s.setOutputSheets);
  const setFatalError = useExcelTranslation((s) => s.setFatalError);
  const fatalError = useExcelTranslation((s) => s.fatalError);
  const settings = useTranslationStore((s) => s.settings);

  const abortRef = useRef<AbortController | null>(null);

  if (!workbook) return null;

  // 校验:至少有一个 Sheet 启用 + 至少选了一列/行 + 至少一个目标语言
  const enabledConfigs = sheetConfigs.filter((c) => c?.include);
  const hasSelections = enabledConfigs.some((c) =>
    c.selectionMode === 'columns' ? c.selectedColumns.length > 0 : c.selectedRows.length > 0
  );
  const hasTargetLang = settings.targetLanguages.length > 0;
  const canRun = enabledConfigs.length > 0 && hasSelections && hasTargetLang && !running;

  async function start() {
    setFatalError(null);
    setErrors([]);
    setOutputSheets([]);
    setProgress(null);

    const ac = new AbortController();
    abortRef.current = ac;
    setRunning(true);

    try {
      const result = await runExcelTranslation({
        workbook: workbook!,
        sheetConfigs,
        settings,
        apiOptions,
        signal: ac.signal,
        onProgress: (p) => setProgress(p),
      });
      setOutputSheets(result.outputSheets);
      setErrors(result.errors);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!ac.signal.aborted) setFatalError(msg);
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }

  function cancel() {
    abortRef.current?.abort();
    setRunning(false);
  }

  const why = !hasTargetLang
    ? '请先选择至少一个目标语言'
    : enabledConfigs.length === 0
      ? '请至少启用一个 Sheet'
      : !hasSelections
        ? '请至少选择一列或一行'
        : '';

  return (
    <SectionCard title="⑤ 开始翻译">
      <div className="flex flex-wrap items-center gap-3">
        {!running ? (
          <button
            onClick={start}
            disabled={!canRun}
            className={cn(
              'inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-semibold transition',
              canRun
                ? 'bg-brand-500 text-white shadow-[0_4px_16px_rgba(52,199,89,0.35)] hover:bg-brand-600'
                : 'cursor-not-allowed bg-ink-200 text-ink-400'
            )}
          >
            <PlayCircle size={16} /> 开始翻译
          </button>
        ) : (
          <button
            onClick={cancel}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-ink-200 bg-white px-6 text-sm font-semibold text-ink-800 hover:border-red-300 hover:text-red-600"
          >
            <StopCircle size={16} /> 取消
          </button>
        )}
        {!canRun && !running && why && (
          <p className="text-[11px] text-ink-500">{why}</p>
        )}
      </div>

      {progress && (
        <div className="mt-4 rounded-2xl border border-ink-200 bg-white p-4 shadow-apple-sm">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-ink-700">
              {running && <Loader2 size={12} className="animate-spin text-brand-500" />}
              {running ? `正在翻译 ${progress.currentSheet}……` : '已完成'}
            </span>
            <span className="text-ink-500">
              {progress.doneCells} / {progress.totalCells} 单元格
              {progress.errors.length > 0 && (
                <span className="ml-2 text-red-500">✗ {progress.errors.length}</span>
              )}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{
                width: `${progress.totalUnits === 0 ? 0 : (progress.doneUnits / progress.totalUnits) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {fatalError && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
          <AlertCircle size={13} className="mt-0.5 shrink-0" />
          <span>{fatalError}</span>
        </div>
      )}
    </SectionCard>
  );
}

// ============================================================
// 输出 + 下载
// ============================================================
function OutputCard() {
  const workbook = useExcelTranslation((s) => s.workbook);
  const outputSheets = useExcelTranslation((s) => s.outputSheets);
  const errors = useExcelTranslation((s) => s.errors);
  const [activeIdx, setActiveIdx] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const activeSheet = outputSheets[activeIdx];

  const PREVIEW_ROWS = 12;
  const PREVIEW_COLS = 8;

  const sheetButtons = useMemo(
    () =>
      outputSheets.map((s, i) => ({
        idx: i,
        name: s.name,
        lang: s.lang,
      })),
    [outputSheets]
  );

  if (outputSheets.length === 0) return null;

  async function handleDownload() {
    setDownloading(true);
    try {
      const blob = await exportMultiSheetXlsx(outputSheets);
      const base = workbook?.fileName.replace(/\.xlsx?$/i, '') || 'translated';
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      downloadBlob(blob, `${base}-translated-${stamp}.xlsx`);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <SectionCard title="⑥ 输出">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-ink-600">
          共 <span className="font-semibold text-ink-900">{outputSheets.length}</span> 个输出 Sheet
          {errors.length > 0 && (
            <span className="ml-2 text-amber-600">· {errors.length} 个单元格出错</span>
          )}
        </p>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
        >
          {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          下载 .xlsx
        </button>
      </div>

      {/* Sheet 切换 */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {sheetButtons.map((b) => (
          <button
            key={b.idx}
            onClick={() => setActiveIdx(b.idx)}
            className={cn(
              'rounded-xl px-3 py-1.5 text-[11px] font-medium transition',
              activeIdx === b.idx
                ? 'bg-brand-500 text-white shadow-[0_2px_8px_rgba(52,199,89,0.3)]'
                : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
            )}
          >
            {b.name}
            <span className="ml-1.5 rounded-md bg-white/30 px-1.5 text-[9px]">
              {getLanguageLabel(b.lang)}
            </span>
          </button>
        ))}
      </div>

      {/* 预览 */}
      {activeSheet && (
        <div className="overflow-x-auto rounded-2xl border border-ink-200">
          <table className="w-full border-collapse text-[11px]">
            <tbody>
              {activeSheet.rows.slice(0, PREVIEW_ROWS).map((row, r) => (
                <tr key={r} className={r === 0 ? 'bg-ink-50/60' : ''}>
                  <td className="w-10 border-r border-ink-200 bg-ink-50/70 px-1 py-1 text-center text-[10px] text-ink-400">
                    {r + 1}
                  </td>
                  {row.slice(0, PREVIEW_COLS).map((cell, c) => {
                    const text =
                      cell.raw == null
                        ? ''
                        : cell.raw instanceof Date
                          ? cell.raw.toISOString().slice(0, 10)
                          : String(cell.raw);
                    return (
                      <td
                        key={c}
                        className="max-w-[200px] truncate border-b border-r border-ink-100 px-2 py-1 align-top text-[11px] text-ink-700"
                        title={text}
                      >
                        {text.length > 40 ? text.slice(0, 40) + '…' : text || (
                          <span className="text-ink-300">·</span>
                        )}
                      </td>
                    );
                  })}
                  {row.length > PREVIEW_COLS && (
                    <td className="border-b border-ink-100 px-2 py-1 text-[10px] text-ink-400">
                      …
                    </td>
                  )}
                </tr>
              ))}
              {activeSheet.rows.length > PREVIEW_ROWS && (
                <tr>
                  <td
                    colSpan={Math.min(activeSheet.rows[0]?.length || 0, PREVIEW_COLS) + 2}
                    className="border-t border-ink-200 bg-ink-50/50 px-2 py-1.5 text-center text-[10px] text-ink-400"
                  >
                    … 还有 {activeSheet.rows.length - PREVIEW_ROWS} 行未展示(下载查看完整)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 错误明细折叠 */}
      {errors.length > 0 && <ErrorsList />}
    </SectionCard>
  );
}

function ErrorsList() {
  const errors = useExcelTranslation((s) => s.errors);
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-medium text-amber-800 hover:bg-amber-100/60"
      >
        <span>{errors.length} 个单元格翻译失败,这些位置保留了原文</span>
        <ChevronDown
          size={13}
          className={cn('transition', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="max-h-[200px] overflow-y-auto border-t border-amber-200 px-4 py-2.5">
          <ul className="space-y-1 text-[11px] text-amber-700">
            {errors.slice(0, 200).map((e, i) => (
              <li key={i}>
                <code className="font-mono">
                  {e.sheetName} · {e.lang} · R{e.row + 1}C{e.col + 1}
                </code>
                : {e.message}
              </li>
            ))}
            {errors.length > 200 && (
              <li className="italic text-amber-600">
                … 还有 {errors.length - 200} 条错误未显示
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 通用容器
// ============================================================
function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 rounded-3xl border border-ink-200 bg-white p-6 shadow-apple-sm">
      <h2 className="mb-4 text-base font-semibold tracking-tight text-ink-900">
        {title}
      </h2>
      {children}
    </section>
  );
}

