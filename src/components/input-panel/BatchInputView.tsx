'use client';

import { useRef, useState } from 'react';
import {
  UploadCloud,
  Loader2,
  X,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  RotateCw,
  Trash2,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useBatchTranslation } from '@/store/useBatchTranslation';
import { parseFile } from '@/lib/parsers';
import { BATCH_SUPPORTED_EXTS } from '@/types/batch';
import type { BatchFile, BatchFileStatus } from '@/types/batch';
import { cn } from '@/lib/utils/cn';

export function BatchInputView() {
  return (
    <div className="space-y-4">
      <UploadZone />
      <FileQueue />
      <ThrottleSettings />
    </div>
  );
}

// ============================================================
// 上传区
// ============================================================
function UploadZone() {
  const addFiles = useBatchTranslation((s) => s.addFiles);
  const updateFile = useBatchTranslation((s) => s.updateFile);
  const running = useBatchTranslation((s) => s.running);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAdd(files: File[]) {
    const eligible: File[] = [];
    const rejected: string[] = [];
    for (const f of files) {
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      if (BATCH_SUPPORTED_EXTS.includes(ext)) eligible.push(f);
      else rejected.push(f.name);
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
      <UploadCloud size={22} className="mb-1.5 text-ink-400" />
      <p className="text-sm font-medium text-ink-700">
        拖入多个文件或点击选择
      </p>
      <p className="mt-1 text-[10px] text-ink-400">
        {BATCH_SUPPORTED_EXTS.join(' / ')}
      </p>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={BATCH_SUPPORTED_EXTS.map((e) => `.${e}`).join(',')}
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length > 0) handleAdd(files);
          if (e.target) e.target.value = '';
        }}
        className="hidden"
      />
    </div>
  );
}

// ============================================================
// 文件队列
// ============================================================
function FileQueue() {
  const files = useBatchTranslation((s) => s.files);
  const removeFile = useBatchTranslation((s) => s.removeFile);
  const clearAll = useBatchTranslation((s) => s.clearAll);
  const running = useBatchTranslation((s) => s.running);

  if (files.length === 0) return null;

  const parsedCount = files.filter((f) => f.status === 'parsed').length;
  const errorCount = files.filter((f) => f.status === 'error').length;
  const doneCount = files.filter((f) => f.status === 'done').length;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-medium text-ink-500">
          队列 {files.length} 个 ·
          <span className="ml-1 text-ink-700">就绪 {parsedCount}</span>
          {doneCount > 0 && (
            <span className="ml-2 text-brand-600">完成 {doneCount}</span>
          )}
          {errorCount > 0 && (
            <span className="ml-2 text-red-500">失败 {errorCount}</span>
          )}
        </p>
        <button
          onClick={clearAll}
          disabled={running}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-ink-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
        >
          <Trash2 size={10} /> 清空
        </button>
      </div>
      <div className="max-h-[360px] space-y-1.5 overflow-y-auto pr-1">
        {files.map((f) => (
          <FileRow
            key={f.id}
            file={f}
            onRemove={() => removeFile(f.id)}
            disabled={running}
          />
        ))}
      </div>
    </div>
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
  return (
    <div className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-2.5 py-2">
      <StatusIcon status={file.status} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-ink-900">
          {file.fileName}
        </p>
        <p className="text-[10px] text-ink-500">
          {file.fileType.toUpperCase()} ·{' '}
          {(file.fileSize / 1024).toFixed(0)}KB
          {file.input?.text && (
            <span className="ml-1.5 text-ink-400">
              · {file.input.text.length.toLocaleString()} 字
            </span>
          )}
          {file.results && (
            <span className="ml-1.5 text-brand-600">
              · {Object.keys(file.results).length} 语
            </span>
          )}
          {file.attempts > 0 && file.status !== 'done' && (
            <span className="ml-1.5 text-amber-600">
              · 重试 {file.attempts}
            </span>
          )}
        </p>
        {file.parseError && (
          <p className="mt-0.5 truncate text-[10px] text-red-600">
            解析:{file.parseError}
          </p>
        )}
        {file.translateError && file.status === 'error' && (
          <p className="mt-0.5 truncate text-[10px] text-red-600">
            翻译:{file.translateError}
          </p>
        )}
      </div>
      <button
        onClick={onRemove}
        disabled={disabled}
        className="rounded-md p-1 text-ink-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
        aria-label="移除"
      >
        <X size={12} />
      </button>
    </div>
  );
}

function StatusIcon({ status }: { status: BatchFileStatus }) {
  if (status === 'queued')
    return <Clock size={13} className="shrink-0 text-ink-400" />;
  if (status === 'parsing')
    return <Loader2 size={13} className="shrink-0 animate-spin text-ink-500" />;
  if (status === 'parsed')
    return <FileCheck size={13} className="shrink-0 text-ink-400" />;
  if (status === 'translating')
    return <Loader2 size={13} className="shrink-0 animate-spin text-brand-500" />;
  if (status === 'retrying')
    return <RotateCw size={13} className="shrink-0 animate-spin text-amber-500" />;
  if (status === 'done')
    return <CheckCircle2 size={13} className="shrink-0 text-brand-500" />;
  if (status === 'error')
    return <AlertCircle size={13} className="shrink-0 text-red-500" />;
  if (status === 'cancelled')
    return <X size={13} className="shrink-0 text-ink-400" />;
  return null;
}

// ============================================================
// 节流配置(折叠)
// ============================================================
function ThrottleSettings() {
  const files = useBatchTranslation((s) => s.files);
  const options = useBatchTranslation((s) => s.options);
  const setDelayBetweenFiles = useBatchTranslation((s) => s.setDelayBetweenFiles);
  const setMaxRetries = useBatchTranslation((s) => s.setMaxRetries);
  const [open, setOpen] = useState(false);

  if (files.length === 0) return null;

  return (
    <div className="rounded-2xl border border-ink-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-left text-xs font-medium text-ink-700 hover:bg-ink-50"
      >
        <span>
          节流策略 · 文件间隔 {options.delayBetweenFilesSec}s · 重试{' '}
          {options.maxRetries} 次
        </span>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {open && (
        <div className="border-t border-ink-100 p-3.5">
          <p className="mb-2 text-[10px] text-ink-500">
            保护 API 稳定性。重试间隔指数退避:5s → 15s → 45s
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[10px] font-medium text-ink-500">
                文件间隔(秒)
              </label>
              <input
                type="number"
                value={options.delayBetweenFilesSec}
                min={0}
                max={120}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isFinite(n)) setDelayBetweenFiles(Math.max(0, Math.min(120, n)));
                }}
                className="h-8 w-full rounded-xl border border-ink-200 bg-white px-2.5 text-xs font-medium text-ink-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium text-ink-500">
                最大重试(次)
              </label>
              <input
                type="number"
                value={options.maxRetries}
                min={0}
                max={5}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isFinite(n)) setMaxRetries(Math.max(0, Math.min(5, n)));
                }}
                className="h-8 w-full rounded-xl border border-ink-200 bg-white px-2.5 text-xs font-medium text-ink-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
