'use client';

import { useMemo, useState } from 'react';
import {
  Copy,
  Maximize2,
  Download,
  FileText,
  FileType2,
  Sparkles,
  ChevronDown,
  PlayCircle,
  StopCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { useTranslationStore, type OutputView } from '@/store/useTranslationStore';
import { useTranslationActions } from '@/store/useTranslationActions';
import { getLanguage } from '@/lib/utils/languages';
import { exportTxt, exportMarkdown, exportDocx, exportPdf, exportZip, type ZipFormat } from '@/lib/exporters';
import { cn } from '@/lib/utils/cn';
import { BatchOutputView } from './BatchOutputView';

export function OutputPanel() {
  const inputMode = useTranslationStore((s) => s.inputMode);

  // 批量模式 → 完全切换到批量视图
  if (inputMode === 'batch') {
    return (
      <Panel number="3" title="批量翻译" noBorderRight>
        <BatchOutputView />
      </Panel>
    );
  }

  return <SingleOutputPanel />;
}

function SingleOutputPanel() {
  const settings = useTranslationStore((s) => s.settings);
  const result = useTranslationStore((s) => s.result);
  const isTranslating = useTranslationStore((s) => s.isTranslating);
  const error = useTranslationStore((s) => s.error);
  const progress = useTranslationStore((s) => s.progress);
  const activeOutputLang = useTranslationStore((s) => s.activeOutputLang);
  const setActiveOutputLang = useTranslationStore((s) => s.setActiveOutputLang);
  const activeOutputView = useTranslationStore((s) => s.activeOutputView);
  const setActiveOutputView = useTranslationStore((s) => s.setActiveOutputView);
  const input = useTranslationStore((s) => s.input);

  const { startTranslation, cancelTranslation } = useTranslationActions();
  const [downloading, setDownloading] = useState(false);
  const [zipMenuOpen, setZipMenuOpen] = useState(false);

  const { mode, targetLanguages } = settings;

  const availableViews = useMemo<{ id: OutputView; label: string }[]>(() => {
    const base: { id: OutputView; label: string }[] = [{ id: 'final', label: '最终译文' }];
    if (mode === 'multi') {
      base.push({ id: 'model-a', label: '模型 A' });
      base.push({ id: 'model-b', label: '模型 B' });
      base.push({ id: 'judge', label: '裁判意见' });
    } else if (mode === 'single') {
      base.push({ id: 'self-review', label: '优化过程' });
    }
    base.push({ id: 'source', label: '原文' });
    return base;
  }, [mode]);

  const modeHint =
    mode === 'quick'
      ? '急速模式:单模型直接输出翻译结果,无审校。'
      : mode === 'single'
      ? '单模型模式:同一模型完成翻译、自审与优化。'
      : '多模型模式:两个模型独立翻译,裁判模型评估并融合最佳结果。';

  const currentText = useMemo(() => {
    if (activeOutputView === 'source') return input.text;
    if (!result) return '';
    if (activeOutputView === 'final') return result.final[activeOutputLang] || '';
    if (activeOutputView === 'model-a') return result.intermediate?.A?.[activeOutputLang] || '';
    if (activeOutputView === 'model-b') return result.intermediate?.B?.[activeOutputLang] || '';
    if (activeOutputView === 'judge') return result.intermediate?.judgeReport?.[activeOutputLang] || '';
    if (activeOutputView === 'self-review')
      return result.intermediate?.selfReviewLog?.[activeOutputLang] || '';
    return '';
  }, [activeOutputView, activeOutputLang, result, input.text]);

  const targetLangItems = useMemo(
    () => targetLanguages.map((id) => getLanguage(id)).filter((l): l is NonNullable<typeof l> => !!l),
    [targetLanguages]
  );

  const canTranslate = input.text.trim().length > 0 && targetLanguages.length > 0 && !isTranslating;

  // 输出文件名基础部分 —— 优先用原文件名,否则用 rootlingo
  const sourceBaseName = useMemo(() => {
    const raw = input.fileName?.replace(/\.[^.]+$/, '');
    return raw && raw.trim().length > 0 ? raw : 'rootlingo';
  }, [input.fileName]);
  const filenameBase = `${sourceBaseName}-${activeOutputLang}`;

  async function handleDownload(format: 'txt' | 'md' | 'docx' | 'pdf') {
    if (!currentText) return;
    setDownloading(true);
    try {
      if (format === 'txt') exportTxt(currentText, filenameBase);
      else if (format === 'md') exportMarkdown(currentText, filenameBase);
      else if (format === 'docx') {
        // 如果原文件是 .docx 且解析出了结构,用结构化导出(保留格式)
        await exportDocx(currentText, filenameBase, input.docxStructured);
      } else if (format === 'pdf') await exportPdf(currentText, filenameBase);
    } finally {
      setDownloading(false);
    }
  }

  async function handleDownloadAll(format: ZipFormat) {
    if (!result?.final) return;
    setDownloading(true);
    setZipMenuOpen(false);
    try {
      await exportZip({
        perLangText: result.final,
        format,
        baseName: sourceBaseName,
        zipName: `${sourceBaseName}-translations`,
        // 如果原文件是 .docx 且解析出了结构,zip 里的 docx 也保留格式
        docxStructured: format === 'docx' ? input.docxStructured : undefined,
      });
    } finally {
      setDownloading(false);
    }
  }

  const progressLabel = progress ? formatStageLabel(progress.stage, progress.lang) : '';

  return (
    <Panel number="3" title="翻译结果" noBorderRight>
      <div className="mb-3 flex items-start gap-2 rounded-2xl bg-brand-50/60 px-3.5 py-2.5 text-xs leading-5 text-brand-700">
        <Sparkles size={13} className="mt-0.5 shrink-0" />
        <span>{modeHint}</span>
      </div>

      <div className="mb-3">
        {!isTranslating ? (
          <button
            type="button"
            onClick={startTranslation}
            disabled={!canTranslate}
            className={cn(
              'group inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition',
              canTranslate
                ? 'bg-brand-500 text-white shadow-[0_4px_16px_rgba(52,199,89,0.35)] hover:bg-brand-600 active:scale-[0.99]'
                : 'cursor-not-allowed bg-ink-200 text-ink-400'
            )}
          >
            <PlayCircle size={16} />
            开始翻译
          </button>
        ) : (
          <button
            type="button"
            onClick={cancelTranslation}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-ink-200 bg-white text-sm font-semibold text-ink-800 shadow-apple-sm transition hover:border-red-300 hover:text-red-600"
          >
            <StopCircle size={16} />
            取消翻译
          </button>
        )}
        {isTranslating && progressLabel && (
          <p className="mt-1.5 flex items-center justify-center gap-1.5 text-center text-[11px] text-brand-600">
            <Loader2 size={11} className="animate-spin" />
            {progressLabel}
          </p>
        )}
        {!canTranslate && !isTranslating && !error && (
          <p className="mt-1.5 text-center text-[11px] text-ink-400">
            {input.text.trim().length === 0
              ? '请先在左侧输入内容'
              : targetLanguages.length === 0
              ? '请至少选择一种目标语言'
              : ''}
          </p>
        )}
        {error && (
          <div className="mt-2 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertCircle size={12} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="mb-3 flex gap-1 rounded-2xl bg-ink-100 p-1 text-xs font-medium">
        {availableViews.map((v) => {
          const active = activeOutputView === v.id;
          return (
            <button
              key={v.id}
              onClick={() => setActiveOutputView(v.id)}
              className={cn(
                'flex-1 rounded-xl px-2.5 py-1.5 transition',
                active ? 'bg-white text-brand-700 shadow-apple-sm' : 'text-ink-500 hover:text-ink-700'
              )}
            >
              {v.label}
            </button>
          );
        })}
      </div>

      {activeOutputView !== 'source' && targetLangItems.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1 rounded-2xl border border-ink-200 bg-white p-1.5">
          {targetLangItems.map((lang) => {
            const active = activeOutputLang === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => setActiveOutputLang(lang.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition',
                  active
                    ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-300'
                    : 'text-ink-600 hover:bg-ink-50'
                )}
              >
                <span className="text-sm leading-none">{lang.flag}</span>
                {lang.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="relative h-[400px] rounded-3xl border border-ink-200 bg-white p-5 shadow-inner shadow-ink-100/50">
        {currentText ? (
          <p className="h-full overflow-y-auto whitespace-pre-wrap text-sm leading-7 text-ink-800">
            {currentText}
          </p>
        ) : (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <Sparkles size={20} className="mx-auto mb-2 text-ink-300" />
              <p className="text-sm text-ink-400">
                {activeOutputView === 'source'
                  ? '左侧尚无输入内容'
                  : isTranslating
                  ? '正在翻译……'
                  : '译文将显示在此处'}
              </p>
            </div>
          </div>
        )}
        {currentText && (
          <div className="absolute bottom-3 right-3 flex gap-1.5">
            <IconBtn
              icon={<Copy size={13} />}
              title="复制"
              onClick={() => navigator.clipboard?.writeText(currentText)}
            />
            <IconBtn icon={<Maximize2 size={13} />} title="放大" />
          </div>
        )}
      </div>

      <SectionTitle title="下载格式" className="mt-5" />
      <div className="grid grid-cols-4 gap-2">
        <DownloadCard label="TXT" onClick={() => handleDownload('txt')} disabled={!currentText || downloading} />
        <DownloadCard label="MD" onClick={() => handleDownload('md')} disabled={!currentText || downloading} />
        <DownloadCard label="Word" onClick={() => handleDownload('docx')} disabled={!currentText || downloading} />
        <DownloadCard label="PDF" onClick={() => handleDownload('pdf')} disabled={!currentText || downloading} />
      </div>

      <div className="relative mt-3">
        <button
          type="button"
          onClick={() => setZipMenuOpen((o) => !o)}
          disabled={!result?.final || Object.keys(result.final).length === 0 || downloading}
          className={cn(
            'flex h-11 w-full items-center justify-center gap-2 rounded-2xl border text-sm font-semibold transition',
            result?.final && Object.keys(result.final).length > 0 && !downloading
              ? 'border-ink-200 bg-white text-ink-800 shadow-apple-sm hover:border-brand-300 hover:text-brand-700'
              : 'cursor-not-allowed border-ink-200 bg-ink-50 text-ink-400'
          )}
        >
          <Download size={14} />
          下载全部 ({targetLanguages.length} 种语言, ZIP)
          <ChevronDown size={13} className="text-ink-400" />
        </button>
        {zipMenuOpen && (
          <div className="absolute right-0 top-[48px] z-30 w-48 rounded-2xl border border-ink-200 bg-white p-1.5 shadow-apple-xl">
            {(['md', 'txt', 'docx'] as ZipFormat[]).map((fmt) => (
              <button
                key={fmt}
                onClick={() => handleDownloadAll(fmt)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-ink-700 transition hover:bg-ink-50"
              >
                <span className="font-medium">{fmt.toUpperCase()}</span>
                <span className="text-[11px] text-ink-400">ZIP 包</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}

function IconBtn({
  icon,
  title,
  onClick,
}: {
  icon: React.ReactNode;
  title?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-xl border border-ink-200 bg-white/90 text-ink-500 shadow-apple-sm backdrop-blur transition hover:border-ink-300 hover:text-ink-800"
    >
      {icon}
    </button>
  );
}

function DownloadCard({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const icon =
    label === 'Word' || label === 'TXT' || label === 'MD' ? (
      <FileText size={14} />
    ) : (
      <FileType2 size={14} />
    );
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-14 flex-col items-center justify-center gap-1 rounded-2xl border bg-white text-[11px] font-semibold shadow-apple-sm transition',
        disabled
          ? 'cursor-not-allowed border-ink-200 text-ink-400 opacity-60'
          : 'border-ink-200 text-ink-700 hover:border-brand-300 hover:text-brand-700'
      )}
    >
      <span className={disabled ? 'text-ink-400' : 'text-brand-500'}>{icon}</span>
      {label}
    </button>
  );
}

function SectionTitle({ title, className }: { title: string; className?: string }) {
  return (
    <p className={cn('mb-2 text-xs font-semibold tracking-wide text-ink-800', className)}>
      {title}
    </p>
  );
}

function formatStageLabel(stage: string, lang?: string): string {
  const langPart = lang ? ` · ${getLanguage(lang)?.label || lang}` : '';
  const labels: Record<string, string> = {
    translate: '翻译中',
    'translate-initial': '初译中',
    'self-review': '自审中',
    optimize: '优化中',
    'translate-a': '模型 A 翻译中',
    'translate-b': '模型 B 翻译中',
    judge: '裁判评审中',
  };
  return (labels[stage] || stage) + langPart;
}
