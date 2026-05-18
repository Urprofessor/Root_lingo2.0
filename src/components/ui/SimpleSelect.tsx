'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface SimpleOption {
  id: string;
  label: string;
  description?: string;
}

interface SimpleSelectProps {
  label: string;
  value: string;
  options: SimpleOption[];
  onChange: (id: string) => void;
}

export function SimpleSelect({ label, value, options, onChange }: SimpleSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = options.find((o) => o.id === value);

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
        <span className="truncate">{current?.label || value}</span>
        <ChevronDown size={14} className="ml-2 shrink-0 text-ink-400" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[68px] z-30 max-h-[260px] overflow-y-auto rounded-2xl border border-ink-200 bg-white p-2 shadow-apple-xl">
          {options.map((opt) => {
            const selected = opt.id === value;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-start gap-2 rounded-xl px-2.5 py-2 text-left transition',
                  selected ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-50'
                )}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                  {selected && <Check size={13} className="text-brand-600" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{opt.label}</span>
                  {opt.description && (
                    <span className="mt-0.5 block text-[11px] leading-4 text-ink-500">
                      {opt.description}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
