'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { ALL_LANGUAGES } from '@/lib/utils/languages';
import { cn } from '@/lib/utils/cn';

interface LanguageMultiSelectProps {
  label: string;
  selected: string[];
  onToggle: (id: string) => void;
  onChange: (langs: string[]) => void;
}

export function LanguageMultiSelect({ label, selected, onToggle, onChange }: LanguageMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_LANGUAGES;
    return ALL_LANGUAGES.filter(
      (l) =>
        l.label.toLowerCase().includes(q) ||
        l.labelEn.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="relative" ref={ref}>
      <label className="mb-1.5 block text-[11px] font-medium text-ink-500">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-2xl border bg-white px-3.5 text-sm font-medium text-ink-800 shadow-apple-sm transition',
          open ? 'border-brand-400 ring-2 ring-brand-100' : 'border-ink-200 hover:border-ink-300'
        )}
      >
        <span className="flex items-center gap-2">
          <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
            {selected.length}
          </span>
          <span>已选择 {selected.length} 种语言</span>
        </span>
        <ChevronDown size={14} className="text-ink-400" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[68px] z-40 rounded-2xl border border-ink-200 bg-white shadow-apple-xl">
          <div className="border-b border-ink-100 p-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索语言"
                className="h-9 w-full rounded-xl border border-ink-200 bg-white pl-8 pr-8 text-sm outline-none placeholder:text-ink-400 focus:border-brand-400"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[280px] overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-xs text-ink-400">没有匹配的语言</div>
            ) : (
              filtered.map((lang) => {
                const checked = selected.includes(lang.id);
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => onToggle(lang.id)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-ink-700 transition hover:bg-ink-50"
                  >
                    <span
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition',
                        checked
                          ? 'bg-brand-500 text-white shadow-[0_0_0_3px_rgba(52,199,89,0.15)]'
                          : 'border border-ink-300'
                      )}
                    >
                      {checked && <Check size={13} />}
                    </span>
                    <span className="text-lg leading-none">{lang.flag}</span>
                    <span className="font-medium">{lang.label}</span>
                    <span className="ml-auto text-[11px] text-ink-400">{lang.labelEn}</span>
                  </button>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-ink-100 p-2">
            <button
              onClick={() => onChange([])}
              className="rounded-xl px-3 py-1.5 text-xs font-medium text-ink-500 hover:bg-ink-50 hover:text-ink-700"
            >
              清空
            </button>
            <button
              onClick={() => onChange(ALL_LANGUAGES.map((l) => l.id))}
              className="rounded-xl px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50"
            >
              全选 ({ALL_LANGUAGES.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
