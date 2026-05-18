'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Sparkles } from 'lucide-react';
import { ALL_LANGUAGES } from '@/lib/utils/languages';
import { cn } from '@/lib/utils/cn';

interface SourceLanguagePickerProps {
  value: string;
  onChange: (id: string) => void;
}

export function SourceLanguagePicker({ value, onChange }: SourceLanguagePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = ALL_LANGUAGES.find((l) => l.id === value);
  const displayLabel = value === 'auto' ? '自动检测' : current?.label || value;
  const displayFlag = value === 'auto' ? null : current?.flag;

  return (
    <div className="relative" ref={ref}>
      <label className="mb-1.5 block text-[11px] font-medium text-ink-500">源语言</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-2xl border bg-white px-3.5 text-sm font-medium text-ink-800 shadow-apple-sm transition',
          open ? 'border-brand-400 ring-2 ring-brand-100' : 'border-ink-200 hover:border-ink-300'
        )}
      >
        <span className="flex items-center gap-2">
          {displayFlag ? (
            <span className="text-base leading-none">{displayFlag}</span>
          ) : (
            <Sparkles size={14} className="text-brand-500" />
          )}
          <span>{displayLabel}</span>
        </span>
        <ChevronDown size={14} className="text-ink-400" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[68px] z-40 max-h-[280px] overflow-y-auto rounded-2xl border border-ink-200 bg-white p-2 shadow-apple-xl">
          <button
            type="button"
            onClick={() => {
              onChange('auto');
              setOpen(false);
            }}
            className={cn(
              'mb-1 flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition',
              value === 'auto' ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-50'
            )}
          >
            <Sparkles size={14} className="text-brand-500" />
            <span className="font-medium">自动检测</span>
            {value === 'auto' && <Check size={13} className="ml-auto text-brand-600" />}
          </button>

          <div className="my-1 border-t border-ink-100" />

          {ALL_LANGUAGES.map((lang) => {
            const selected = value === lang.id;
            return (
              <button
                key={lang.id}
                type="button"
                onClick={() => {
                  onChange(lang.id);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition',
                  selected ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-50'
                )}
              >
                <span className="text-base leading-none">{lang.flag}</span>
                <span className="font-medium">{lang.label}</span>
                <span className="ml-auto text-[11px] text-ink-400">{lang.labelEn}</span>
                {selected && <Check size={13} className="ml-1 text-brand-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
