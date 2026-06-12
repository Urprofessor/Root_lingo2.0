'use client';

import { useRef, useState, useMemo } from 'react';
import {
  PlayCircle,
  StopCircle,
  Loader2,
  Download,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useTranslationStore } from '@/store/useTranslationStore';
import { useBatchTranslation } from '@/store/useBatchTranslation';
import { runBatchTranslation } from '@/lib/batch/runner';
import {
  buildDocxBlob,
  buildDocxBlobFromStructured,
} from '@/lib/exporters/docx';
import { buildTxtBlob, buildMdBlob } from '@/lib/exporters/txt';
import type { BatchFile } from '@/types/batch';
import { cn } from '@/lib/utils/cn';
import { getLanguageLabel } from '@/lib/utils/languages';

export function BatchOutputView() {
  return (
    <div className="space-y-4">
      <RunSection />
      <ResultsList />
    </div>
  );
}

// ============================================================
// 运行按钮 + 进度
// ============================================================
function RunSection() {
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

  const parsedCount = files.filter((f) => f.status === 'parsed').length;
  const canRun = !running && parsedCount > 0 && settings.targetLanguages.length > 0;

  const why =
    files.length === 0
      ? '请先在左侧上传文件'
      : !settings.targetLanguages.length
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
    <div>
      {!running ? (
        <button
          type="button"
          onClick={start}
          disabled={!canRun}
          className={cn(
            'inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition',
            canRun
              ? 'bg-brand-500 text-white shadow-[0_4px_16px_rgba(52,199,89,0.35)] hover:bg-brand-600'
              : 'cursor-not-allowed bg-ink-200 text-ink-400'
          )}
        >
          <PlayCircle size={16} />
          开始批量翻译{parsedCount > 0 && `(${parsedCount} 个文件)`}
        </button>
      ) : (
        <button
          type="button"
          onClick={cancel}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-ink-200 bg-white text-sm font-semibold text-ink-800 shadow-apple-sm transition hover:border-red-300 hover:text-red-600"
        >
          <StopCircle size={16} />
          取消批量翻译
        </button>
      )}
      {!canRun && !running && why && (
        <p className="mt-1.5 text-center text-[11px] text-ink-400">{why}</p>
      )}

      {progress && (
        <div className="mt-3 rounded-2xl border border-ink-200 bg-white p-3 shadow-apple-sm">
          <div className="mb-1.5 flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 font-medium text-ink-700">
              {running && <Loader2 size={11} className="animate-spin text-brand-500" />}
              {running
                ? progress.currentFileName
                  ? `${progress.currentFileName}`
                  : '准备中……'
                : '已完成'}
            </span>
            <span className="text-ink-500">
              {progress.doneFiles + progress.errorFiles}/{progress.totalFiles}
              {progress.errorFiles > 0 && (
                <span className="ml-1.5 text-red-500">✗{progress.errorFiles}</span>
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
            <p className="mt-1.5 text-[10px] text-amber-600">{progress.retryHint}</p>
          )}
        </div>
      )}

      {fatalError && (
        <div className="mt-3 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle size={12} className="mt-0.5 shrink-0" />
          <span>{fatalError}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 结果列表 + 下载
// ============================================================
function ResultsList() {
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
    <div className="rounded-2xl border border-ink-200 bg-white p-3.5">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-ink-600">
          完成 <b className="text-ink-900">{doneFiles.length}</b> 文件 ·{' '}
          <b className="text-ink-900">{totalOutputs}</b> 个译文
        </p>
        <button
          onClick={handleDownloadAll}
          disabled={downloading}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
        >
          {downloading ? (
            <Loader2 size={11} className="animate-spin" />
          ) : (
            <Download size={11} />
          )}
          全部 ZIP
        </button>
      </div>

      <div className="max-h-[320px] space-y-1.5 overflow-y-auto pr-1">
        {doneFiles.map((f) => (
          <div
            key={f.id}
            className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-2.5 py-2"
          >
            <CheckCircle2 size={13} className="shrink-0 text-brand-500" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-ink-900">
                {f.fileName}
              </p>
              <p className="mt-0.5 flex flex-wrap gap-1 text-[10px] text-ink-500">
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
              className="inline-flex items-center gap-1 rounded-md border border-ink-200 px-2 py-1 text-[10px] font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
            >
              <Download size={10} /> ZIP
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 工具
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
