'use client';

import { useState } from 'react';
import {
  Sparkles,
  PlayCircle,
  StopCircle,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  Download,
  Languages,
  Trash2,
} from 'lucide-react';
import { ModelPicker } from '@/components/settings-panel/ModelPicker';
import { useTipsLocalization } from '@/store/useTipsLocalization';
import { DEFAULT_MODEL } from '@/lib/utils/models';
import { TIPS_LOCALES as LOCALES } from '@/lib/tips/prompt';
import { cn } from '@/lib/utils/cn';
import type { ModelRef } from '@/types';

const PLACEHOLDER = `post_m03_baby_01,en-US,"Weight likely doubled from birth — your feeding is spot on."
post_m03_baby_02,en-US,"Rolling attempts starting — never leave baby alone on a bed."
post_m03_baby_03,en-US,"Belly laughs and big smiles — the best reward for sleepless nights."`;

export function TipsLocalizationPage() {
  const [model, setModel] = useState<ModelRef>(DEFAULT_MODEL);
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);
  const { running, progress, results, combinedCsv, error, start, cancel, reset } =
    useTipsLocalization();

  const successCount = results.filter((r) => r.csv && !r.error).length;
  const errorCount = results.filter((r) => r.error).length;

  function handleStart() {
    start(model.modelId, input);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(combinedCsv);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  function handleDownload() {
    const blob = new Blob(['\ufeff' + combinedCsv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.download = `tips-localized-${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50">
          <Languages size={22} className="text-brand-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink-900">Tips 本地化</h1>
          <p className="text-xs text-ink-500">
            英文 tips 批量本地化为 14 种语言,输出 CSV
          </p>
        </div>
      </div>

      {/* 模型选择 */}
      <div className="mb-4 max-w-xs">
        <ModelPicker label="选择模型" value={model} onChange={setModel} disabled={running} />
      </div>

      {/* 输入 */}
      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-[11px] font-medium text-ink-500">
            输入 CSV(每行一条,格式:tip_code,lang_code,"content")
          </label>
          {input && !running && (
            <button
              onClick={() => setInput('')}
              className="inline-flex items-center gap-1 text-[11px] text-ink-400 hover:text-ink-700"
            >
              <Trash2 size={10} /> 清空
            </button>
          )}
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={PLACEHOLDER}
          disabled={running}
          rows={8}
          className="w-full resize-y rounded-2xl border border-ink-200 bg-white p-4 font-mono text-xs leading-6 text-ink-800 outline-none placeholder:text-ink-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:bg-ink-50"
        />
        <p className="mt-1.5 text-[11px] text-ink-400">
          目标语言固定 14 种:{LOCALES.map((l) => l.code).join('、')}
        </p>
      </div>

      {/* 操作按钮 */}
      <div className="mb-4">
        {!running ? (
          <button
            onClick={handleStart}
            disabled={!input.trim()}
            className={cn(
              'inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-semibold transition',
              input.trim()
                ? 'bg-brand-500 text-white shadow-[0_4px_16px_rgba(52,199,89,0.35)] hover:bg-brand-600'
                : 'cursor-not-allowed bg-ink-200 text-ink-400'
            )}
          >
            <PlayCircle size={16} /> 开始生成
          </button>
        ) : (
          <button
            onClick={cancel}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-ink-200 bg-white px-6 text-sm font-semibold text-ink-800 hover:border-red-300 hover:text-red-600"
          >
            <StopCircle size={16} /> 取消
          </button>
        )}
      </div>

      {/* 进度 */}
      {progress && (
        <div className="mb-4 rounded-2xl border border-ink-200 bg-white p-4 shadow-apple-sm">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-ink-700">
              {running && <Loader2 size={12} className="animate-spin text-brand-500" />}
              {running
                ? `正在处理 ${progress.currentTipCode || ''}…`
                : '已完成'}
            </span>
            <span className="text-ink-500">
              {progress.done} / {progress.total}
              {successCount > 0 && <span className="ml-2 text-brand-600">✓ {successCount}</span>}
              {errorCount > 0 && <span className="ml-2 text-red-500">✗ {errorCount}</span>}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
          <AlertCircle size={13} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 逐条错误 */}
      {results.some((r) => r.error) && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
          <p className="mb-1.5 text-xs font-semibold text-amber-800">部分条目失败:</p>
          <ul className="space-y-1 text-[11px] text-amber-700">
            {results
              .filter((r) => r.error)
              .map((r) => (
                <li key={r.tipCode}>
                  <code className="font-mono">{r.tipCode}</code>: {r.error}
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* 输出 */}
      {successCount > 0 && (
        <div className="rounded-3xl border border-ink-200 bg-white shadow-apple-sm">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3">
            <p className="text-sm font-semibold text-ink-900">
              输出 CSV
              <span className="ml-2 text-xs font-normal text-ink-500">
                {successCount} 条 × 14 语言 = {successCount * 14} 行
              </span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-600 transition hover:border-brand-300 hover:text-brand-700"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? '已复制' : '复制'}
              </button>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1 rounded-xl bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-600"
              >
                <Download size={12} /> 下载 CSV
              </button>
            </div>
          </div>
          <pre className="max-h-[400px] overflow-auto whitespace-pre p-5 font-mono text-[11px] leading-5 text-ink-700">
            {combinedCsv}
          </pre>
        </div>
      )}
    </div>
  );
}
