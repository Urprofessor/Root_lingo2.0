'use client';

import { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileType,
  Image as ImageIcon,
  Subtitles,
  Type,
  Loader2,
  X,
  FileCheck,
  Layers,
  type LucideIcon,
} from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { useTranslationStore } from '@/store/useTranslationStore';
import { parseFile } from '@/lib/parsers';
import { cn } from '@/lib/utils/cn';
import { BatchInputView } from './BatchInputView';

type InputTab = 'text' | 'file' | 'image' | 'srt' | 'batch';

const INPUT_TABS: { id: InputTab; label: string; icon: LucideIcon }[] = [
  { id: 'text', label: '粘贴文本', icon: Type },
  { id: 'file', label: '上传文件', icon: FileType },
  { id: 'image', label: '图片 OCR', icon: ImageIcon },
  { id: 'srt', label: '字幕 .srt', icon: Subtitles },
  { id: 'batch', label: '批量文件', icon: Layers },
];

const SUPPORTED_FORMATS = ['.txt', '.md', '.docx', '.pdf', '.pptx', '.xlsx', '.srt', '图片'];
const MAX_CHARS = 500000;

export function InputPanel() {
  const [activeTab, setActiveTab] = useState<InputTab>('text');
  const input = useTranslationStore((s) => s.input);
  const setInput = useTranslationStore((s) => s.setInput);
  const setInputText = useTranslationStore((s) => s.setInputText);
  const setInputMode = useTranslationStore((s) => s.setInputMode);

  // 切换 tab 时同步 inputMode 给 OutputPanel
  useEffect(() => {
    setInputMode(activeTab === 'batch' ? 'batch' : 'single');
  }, [activeTab, setInputMode]);
  const [parsing, setParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState<number | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const charCount = input.text.length;

  async function handleFile(file: File) {
    setParsing(true);
    setParseError(null);
    setParseProgress(null);
    try {
      const parsed = await parseFile(file, (p) => setParseProgress(p));
      setInput(parsed);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : '文件解析失败');
    } finally {
      setParsing(false);
      setParseProgress(null);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function clearFile() {
    setInput({ type: 'text', text: '' });
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <Panel number="1" title="输入内容">
      <div className="mb-4 flex flex-wrap gap-1.5">
        {INPUT_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition',
                active
                  ? 'bg-brand-500 text-white shadow-[0_2px_8px_rgba(52,199,89,0.3)]'
                  : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
              )}
            >
              <Icon size={12} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'text' && (
        <TextInputArea value={input.text} onChange={setInputText} charCount={charCount} />
      )}

      {activeTab === 'batch' && <BatchInputView />}

      {(activeTab === 'file' || activeTab === 'image' || activeTab === 'srt') && (
        <FileInputArea
          accept={
            activeTab === 'image'
              ? 'image/*'
              : activeTab === 'srt'
              ? '.srt'
              : '.txt,.md,.docx,.pdf,.pptx,.xlsx,.srt'
          }
          parsing={parsing}
          parseProgress={parseProgress}
          parseError={parseError}
          dragOver={dragOver}
          fileInputRef={fileInputRef}
          input={input}
          tab={activeTab}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onPick={() => fileInputRef.current?.click()}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          onClear={clearFile}
        />
      )}

      {activeTab !== 'batch' && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold text-ink-700">支持格式</p>
          <div className="flex flex-wrap gap-1.5">
            {SUPPORTED_FORMATS.map((fmt) => (
              <span
                key={fmt}
                className="inline-flex items-center rounded-lg border border-ink-200 bg-white px-2 py-1 text-[10px] font-medium text-ink-600 shadow-apple-sm"
              >
                {fmt}
              </span>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}

function TextInputArea({
  value,
  onChange,
  charCount,
}: {
  value: string;
  onChange: (v: string) => void;
  charCount: number;
}) {
  return (
    <div className="relative h-[420px] rounded-3xl border border-ink-200 bg-white shadow-inner shadow-ink-100/50">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="在此粘贴或输入要翻译的文本……"
        className="h-full w-full resize-none rounded-3xl bg-transparent p-5 text-sm leading-7 text-ink-800 outline-none placeholder:text-ink-400"
      />
      <div className="pointer-events-none absolute bottom-3 right-4 inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-medium text-ink-400 backdrop-blur-sm">
        <span className={charCount > MAX_CHARS * 0.9 ? 'text-amber-600' : ''}>
          {charCount.toLocaleString()}
        </span>
        <span>/ {MAX_CHARS.toLocaleString()}</span>
      </div>
    </div>
  );
}

function FileInputArea({
  accept,
  parsing,
  parseProgress,
  parseError,
  dragOver,
  fileInputRef,
  input,
  tab,
  onDrop,
  onDragOver,
  onDragLeave,
  onPick,
  onChange,
  onClear,
}: {
  accept: string;
  parsing: boolean;
  parseProgress: number | null;
  parseError: string | null;
  dragOver: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  input: { fileName?: string; text: string };
  tab: InputTab;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onPick: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  const hint =
    tab === 'image'
      ? '拖入图片或点击选择 · PNG / JPG / WebP(浏览器内 OCR)'
      : tab === 'srt'
      ? '拖入字幕文件或点击选择 · .srt'
      : '拖入文件或点击选择';

  return (
    <div className="space-y-3">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={onPick}
        className={cn(
          'flex h-[240px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed bg-ink-50/40 px-6 text-center transition',
          dragOver
            ? 'border-brand-400 bg-brand-50/60'
            : 'border-ink-300 hover:border-ink-400 hover:bg-ink-50/70'
        )}
      >
        {parsing ? (
          <>
            <Loader2 size={28} className="mb-2 animate-spin text-brand-500" />
            <p className="text-sm font-medium text-ink-700">正在解析文件……</p>
            {parseProgress !== null && (
              <p className="mt-1 text-[11px] text-ink-500">
                OCR 进度 {Math.round(parseProgress * 100)}%
              </p>
            )}
          </>
        ) : input.fileName ? (
          <>
            <FileCheck size={28} className="mb-2 text-brand-500" />
            <p className="mb-1 text-sm font-medium text-ink-900">{input.fileName}</p>
            <p className="text-[11px] text-ink-500">已解析 {input.text.length.toLocaleString()} 字符</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="mt-3 inline-flex items-center gap-1 rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <X size={11} /> 移除
            </button>
          </>
        ) : (
          <>
            <UploadCloud size={28} className="mb-2 text-ink-400" />
            <p className="text-sm font-medium text-ink-700">{hint}</p>
            <p className="mt-1 text-[11px] text-ink-400">单个文件最大 100MB</p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={onChange}
          className="hidden"
        />
      </div>

      {parseError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs text-red-700">
          {parseError}
        </div>
      )}

      {input.text && (
        <div className="rounded-2xl border border-ink-200 bg-white p-3 shadow-apple-sm">
          <p className="mb-1.5 text-[11px] font-semibold text-ink-500">已解析的文本预览</p>
          <p className="max-h-[120px] overflow-y-auto whitespace-pre-wrap text-xs leading-5 text-ink-700">
            {input.text.slice(0, 600)}
            {input.text.length > 600 && '……'}
          </p>
        </div>
      )}
    </div>
  );
}
