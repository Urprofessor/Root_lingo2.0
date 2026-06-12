'use client';

import { useRef, useState, useMemo } from 'react';
import {
  Layers,
  UploadCloud,
  Loader2,
  X,
  FileCheck,
  PlayCircle,
  StopCircle,
  Download,
  AlertCircle,
  CheckCircle2,
  RotateCw,
  Trash2,
  Clock,
} from 'lucide-react';
import { ModeSelector } from '@/components/settings-panel/ModeSelector';
import { ModelPicker } from '@/components/settings-panel/ModelPicker';
import { LanguageMultiSelect } from '@/components/settings-panel/LanguageMultiSelect';
import { SourceLanguagePicker } from '@/components/settings-panel/SourceLanguagePicker';
import { SimpleSelect } from '@/components/ui/SimpleSelect';
import { useTranslationStore } from '@/store/useTranslationStore';
import { useBatchTranslation } from '@/store/useBatchTranslation';
import { parseFile } from '@/lib/parsers';
import {
  buildDocxBlob,
  buildDocxBlobFromStructured,
} from '@/lib/exporters/docx';
import { buildTxtBlob, buildMdBlob } from '@/lib/exporters/txt';
import { runBatchTranslation } from '@/lib/batch/runner';
import { BATCH_SUPPORTED_EXTS } from '@/types/batch';
import type { BatchFile, BatchFileStatus } from '@/types/batch';
import { cn } from '@/lib/utils/cn';
import { getLanguageLabel } from '@/lib/utils/languages';

export function BatchTranslatePage() {
  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <Header />
      <FileUploadCard />
      <FileListCard />
      <SettingsCard />
      <ThrottleCard />
      <RunBar />
      <ResultsCard />
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
        <Layers size={22} className="text-brand-600" />
      </div>
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink-900">
          批量翻译
        </h1>
        <p className="text-xs text-ink-500">
          一次上传多个文件,按队列翻译;文件之间留间隔,单文件失败自动重试
        </p>
      </div>
    </div>
  );
}

// ============================================================
// 文件上传(多选)
// ============================================================
function FileUploadCard() {
  const addFiles = useBatchTranslation((s) => s.addFiles);
  const updateFile = useBatchTranslation((s) => s.updateFile);
  const running = useBatchTranslation((s) => s.running);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAdd(files: File[]) {
    // 过滤不支持的扩展名
    const eligible: File[] = [];
    const rejected: string[] = [];
    for (const f of files) {
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      if (BATCH_SUPPORTED_EXTS.includes(ext)) {
        eligible.push(f);
      } else {
        rejected.push(f.name);
      }
    }

    if (rejected.length > 0) {
      alert(
        `以下文件类型不支持,已跳过:\n${rejected.join('\n')}\n\n支持的格式:${BATCH_SUPPORTED_EXTS.join(', ')}`
      );
    }
    if (eligible.length === 0) return;

    const batchFiles: BatchFile[] = eligible.map((f) => ({
      id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `f-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      file: f,
      fileName: f.name,
      fileSize: f.size,
      fileType: (f.name.split('.').pop() || '').toLowerCase(),
      status: 'queued' as BatchFileStatus,
      attempts: 0,
    }));
    addFiles(batchFiles);

    // 顺序解析(避免一次性触发太多 worker)
    for (const bf of batchFiles) {
      updateFile(bf.id, { status: 'parsing' });
      try {
        const input = await parseFile(bf.file);
        updateFile(bf.id, { status: 'parsed', input });
      } catch (e) {
        updateFile(bf.id, {
          status: 'error',
          parseError: e instanceof Error ? e.message : String(e),
        });
      }
    }
  }

  return (
    <SectionCard title="① 上传文件(多选)">
      <div
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const files = Array.from(e.dataTransfer.files);
          if (files.length > 0) handleAdd(files);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => !running && fileInputRef.current?.click()}
        className={cn(
          'flex h-[140px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed bg-ink-50/40 px-6 text-center transition',
          dragOver
            ? 'border-brand-400 bg-brand-50/60'
            : 'border-ink-300 hover:border-ink-400 hover:bg-ink-50/70',
          running && 'pointer-events-none opacity-50'
        )}
      >
        <UploadCloud size={24} className="mb-2 text-ink-400" />
        <p className="text-sm font-medium text-ink-700">
          拖入多个文件或点击选择
        </p>
        <p className="mt-1 text-[11px] text-ink-400">
          支持:{BATCH_SUPPORTED_EXTS.join(' / ')} · 重复上传会被叠加
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={BATCH_SUPPORTED_EXTS.map((e) => `.${e}`).join(',')}
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length > 0) handleAdd(files);
            // 清空 input 以允许同名文件再次添加
            if (e.target) e.target.value = '';
          }}
          className="hidden"
        />
      </div>
    </SectionCard>
  );
}

// ============================================================
// 文件队列
// ============================================================
function FileListCard() {
  const files = useBatchTranslation((s) => s.files);
  const removeFile = useBatchTranslation((s) => s.removeFile);
  const clearAll = useBatchTranslation((s) => s.clearAll);
  const running = useBatchTranslation((s) => s.running);

  if (files.length === 0) return null;

  const parsedCount = files.filter((f) => f.status === 'parsed').length;
  const errorCount = files.filter((f) => f.status === 'error').length;
  const doneCount = files.filter((f) => f.status === 'done').length;

  return (
    <SectionCard title={`② 文件队列(共 ${files.length})`}>
      <div className="mb-3 flex items-center gap-3 text-[11px]">
        <span className="text-ink-600">
          就绪 <b className="text-ink-900">{parsedCount}</b>
        </span>
        {doneCount > 0 && (
          <span className="text-brand-600">完成 {doneCount}</span>
        )}
        {errorCount > 0 && (
          <span className="text-red-500">失败 {errorCount}</span>
        )}
        <div className="ml-auto">
          <button
            onClick={clearAll}
            disabled={running}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium text-ink-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
          >
            <Trash2 size={11} /> 清空全部
          </button>
        </div>
      </div>

      <div className="max-h-[420px] space-y-2 overflow-y-auto">
        {files.map((f) => (
          <FileRow
            key={f.id}
            file={f}
            onRemove={() => removeFile(f.id)}
            disabled={running}
          />
        ))}
      </div>
    </SectionCard>
  );
}

function FileRow({
  file,
  onRemove,
  disabled,
}: {
  file: BatchFile;
  onRemove: () => void;
  disabled: boolean;
}) {
  const sizeKB = (file.fileSize / 1024).toFixed(1);

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white px-3.5 py-2.5">
      <StatusIcon status={file.status} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink-900">
          {file.fileName}
        </p>
        <p className="text-[11px] text-ink-500">
          {file.fileType.toUpperCase()} · {sizeKB} KB
          {file.input?.text && (
            <span className="ml-2 text-ink-400">
              · 解析 {file.input.text.length.toLocaleString()} 字符
            </span>
          )}
          {file.results && (
            <span className="ml-2 text-brand-600">
              · 译出 {Object.keys(file.results).length} 种语言
            </span>
          )}
          {file.attempts > 0 && file.status !== 'done' && (
            <span className="ml-2 text-amber-600">
              · 已重试 {file.attempts} 次
            </span>
          )}
        </p>
        {file.parseError && (
          <p className="mt-0.5 text-[11px] text-red-600">解析失败:{file.parseError}</p>
        )}
        {file.translateError && file.status === 'error' && (
          <p className="mt-0.5 text-[11px] text-red-600">翻译失败:{file.translateError}</p>
        )}
      </div>
      <button
        onClick={onRemove}
        disabled={disabled}
        className="rounded-lg p-1.5 text-ink-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
        aria-label="移除"
      >
        <X size={13} />
      </button>
    </div>
  );
}

function StatusIcon({ status }: { status: BatchFileStatus }) {
  if (status === 'queued')
    return <Clock size={16} className="shrink-0 text-ink-400" />;
  if (status === 'parsing')
    return <Loader2 size={16} className="shrink-0 animate-spin text-ink-500" />;
  if (status === 'parsed')
    return <FileCheck size={16} className="shrink-0 text-ink-400" />;
  if (status === 'translating')
    return <Loader2 size={16} className="shrink-0 animate-spin text-brand-500" />;
  if (status === 'retrying')
    return <RotateCw size={16} className="shrink-0 animate-spin text-amber-500" />;
  if (status === 'done')
    return <CheckCircle2 size={16} className="shrink-0 text-brand-500" />;
  if (status === 'error')
    return <AlertCircle size={16} className="shrink-0 text-red-500" />;
  if (status === 'cancelled')
    return <X size={16} className="shrink-0 text-ink-400" />;
  return null;
}

// ============================================================
// 翻译设置(复用主翻译 store,与工作台/Excel 翻译共享)
// ============================================================
function SettingsCard() {
  const files = useBatchTranslation((s) => s.files);
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

  if (files.length === 0) return null;
  const isMulti = settings.mode === 'multi';

  return (
    <SectionCard title="③ 翻译设置">
      <p className="mb-3 text-[11px] text-ink-500">
        所有文件用同一套设置。这些设置与"工作台"共享。
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
// 节流策略
// ============================================================
function ThrottleCard() {
  const files = useBatchTranslation((s) => s.files);
  const options = useBatchTranslation((s) => s.options);
  const setDelayBetweenFiles = useBatchTranslation((s) => s.setDelayBetweenFiles);
  const setMaxRetries = useBatchTranslation((s) => s.setMaxRetries);

  if (files.length === 0) return null;

  return (
    <SectionCard title="④ 节流策略">
      <p className="mb-3 text-[11px] text-ink-500">
        保护 API 稳定性。文件之间留间隔,失败自动重试(指数退避:5s → 15s → 45s)。
      </p>
      <div className="grid grid-cols-2 gap-3">
        <NumberInput
          label="文件之间间隔"
          value={options.delayBetweenFilesSec}
          min={0}
          max={120}
          onChange={setDelayBetweenFiles}
          suffix="秒"
          hint="0 = 不间隔,推荐 5-10 秒"
        />
        <NumberInput
          label="单文件最大重试"
          value={options.maxRetries}
          min={0}
          max={5}
          onChange={setMaxRetries}
          suffix="次"
          hint="失败时自动重试,0 = 不重试"
        />
      </div>
    </SectionCard>
  );
}

function NumberInput({
  label,
  value,
  min,
  max,
  onChange,
  hint,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  hint?: string;
  suffix?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-medium text-ink-500">
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, n)));
          }}
          className="h-10 w-full rounded-2xl border border-ink-200 bg-white px-3.5 pr-12 text-sm font-medium text-ink-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-ink-400">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-[10px] text-ink-400">{hint}</p>}
    </div>
  );
}

// ============================================================
// 运行栏
// ============================================================
function RunBar() {
  const files = useBatchTranslation((s) => s.files);
  const options = useBatchTranslation((s) => s.options);
  const running = useBatchTranslation((s) => s.running);
  const setRunning = useBatchTranslation((s) => s.setRunning);
  const updateFile = useBatchTranslation((s) => s.updateFile);
  const progress = useBatchTranslation((s) => s.progress);
  const setProgress = useBatchTranslation((s) => s.setProgress);
  const fatalError = useBatchTranslation((s) => s.fatalError);
  const setFatalError = useBatchTranslation((s) => s.setFatalError);
  const settings = useTranslationStore((s) => s.settings);

  const abortRef = useRef<AbortController | null>(null);

  if (files.length === 0) return null;

  const parsedCount = files.filter((f) => f.status === 'parsed').length;
  const canRun =
    !running &&
    parsedCount > 0 &&
    settings.targetLanguages.length > 0;
  const why = !settings.targetLanguages.length
    ? '请先选择至少一个目标语言'
    : parsedCount === 0
      ? '没有已解析的文件可翻译'
      : '';

  async function start() {
    setFatalError(null);
    const ac = new AbortController();
    abortRef.current = ac;
    setRunning(true);

    try {
      await runBatchTranslation({
        files,
        settings,
        options,
        signal: ac.signal,
        onFileUpdate: updateFile,
        onProgress: setProgress,
      });
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
            <PlayCircle size={16} /> 开始批量翻译({parsedCount} 个文件)
          </button>
        ) : (
          <button
            onClick={cancel}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-ink-200 bg-white px-6 text-sm font-semibold text-ink-800 hover:border-red-300 hover:text-red-600"
          >
            <StopCircle size={16} /> 取消批量翻译
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
              {running
                ? progress.currentFileName
                  ? `处理中:${progress.currentFileName}`
                  : '准备中……'
                : '已完成'}
            </span>
            <span className="text-ink-500">
              {progress.doneFiles + progress.errorFiles} / {progress.totalFiles} 文件
              {progress.errorFiles > 0 && (
                <span className="ml-2 text-red-500">✗ {progress.errorFiles}</span>
              )}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{
                width: `${progress.totalFiles === 0 ? 0 : ((progress.doneFiles + progress.errorFiles) / progress.totalFiles) * 100}%`,
              }}
            />
          </div>
          {progress.retryHint && (
            <p className="mt-2 text-[11px] text-amber-600">{progress.retryHint}</p>
          )}
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
// 结果 + 下载
// ============================================================
function ResultsCard() {
  const files = useBatchTranslation((s) => s.files);
  const [downloading, setDownloading] = useState(false);

  const doneFiles = useMemo(
    () => files.filter((f) => f.status === 'done' && f.results),
    [files]
  );

  if (doneFiles.length === 0) return null;

  const totalOutputs = doneFiles.reduce(
    (n, f) => n + Object.keys(f.results || {}).length,
    0
  );

  async function handleDownloadAll() {
    setDownloading(true);
    try {
      const blob = await buildBatchZip(doneFiles);
      const stamp = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `批量翻译-${stamp}.zip`);
    } finally {
      setDownloading(false);
    }
  }

  async function handleDownloadOne(f: BatchFile) {
    if (!f.results) return;
    setDownloading(true);
    try {
      const blob = await buildBatchZip([f]);
      const base = f.fileName.replace(/\.[^.]+$/, '');
      downloadBlob(blob, `${base}-translations.zip`);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <SectionCard title="⑥ 下载结果">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-ink-600">
          已完成 <b className="text-ink-900">{doneFiles.length}</b> 个文件 ·{' '}
          <b className="text-ink-900">{totalOutputs}</b> 个译文
        </p>
        <button
          onClick={handleDownloadAll}
          disabled={downloading}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
        >
          {downloading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Download size={14} />
          )}
          下载全部 ZIP
        </button>
      </div>

      <div className="space-y-2">
        {doneFiles.map((f) => (
          <div
            key={f.id}
            className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white px-3.5 py-2.5"
          >
            <CheckCircle2 size={16} className="shrink-0 text-brand-500" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink-900">
                {f.fileName}
              </p>
              <p className="mt-0.5 flex flex-wrap gap-1.5 text-[11px] text-ink-500">
                {Object.keys(f.results || {}).map((lang) => (
                  <span
                    key={lang}
                    className="inline-flex items-center rounded-md bg-brand-50 px-1.5 py-0.5 font-medium text-brand-700"
                  >
                    {getLanguageLabel(lang)}
                  </span>
                ))}
              </p>
            </div>
            <button
              onClick={() => handleDownloadOne(f)}
              disabled={downloading}
              className="inline-flex items-center gap-1 rounded-xl border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
            >
              <Download size={11} /> 下载
            </button>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ============================================================
// 工具:ZIP 构建 + 输出格式映射
// ============================================================
async function buildBatchZip(files: BatchFile[]): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  for (const f of files) {
    if (!f.results) continue;
    const baseName = f.fileName.replace(/\.[^.]+$/, '');
    const outputFormat = mapOutputFormat(f.fileType);

    for (const [lang, text] of Object.entries(f.results)) {
      if (!text) continue;
      const fname = `${baseName}-${lang}`;
      if (outputFormat === 'docx') {
        const blob = f.input?.docxStructured
          ? await buildDocxBlobFromStructured(f.input.docxStructured, text)
          : await buildDocxBlob(text);
        zip.file(`${fname}.docx`, blob);
      } else if (outputFormat === 'md') {
        zip.file(`${fname}.md`, buildMdBlob(text));
      } else {
        zip.file(`${fname}.txt`, buildTxtBlob(text));
      }
    }
  }
  return await zip.generateAsync({ type: 'blob' });
}

function mapOutputFormat(ext: string): 'docx' | 'md' | 'txt' {
  const e = ext.toLowerCase();
  if (e === 'docx') return 'docx';
  if (e === 'md' || e === 'markdown') return 'md';
  if (e === 'txt') return 'txt';
  // pdf / pptx / xlsx / csv 等 → md(比 txt 表达力强,不引入额外格式损失)
  return 'md';
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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
