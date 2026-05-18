'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { ALL_PROVIDERS, getFullModelLabel, getProvider } from '@/lib/utils/models';
import { cn } from '@/lib/utils/cn';
import type { ModelRef } from '@/types';

interface ModelPickerProps {
  label: string;
  value: ModelRef;
  onChange: (model: ModelRef) => void;
  muted?: boolean;
  disabled?: boolean;
}

export function ModelPicker({ label, value, onChange, muted, disabled }: ModelPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const provider = getProvider(value.providerId);
  const displayLabel = getFullModelLabel(value);

  return (
    <div className={cn('relative', muted && 'opacity-45 pointer-events-none')} ref={ref}>
      <label className="mb-1.5 block text-[11px] font-medium text-ink-500">{label}</label>
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-2xl border bg-white px-3.5 text-sm font-medium text-ink-800 shadow-apple-sm transition',
          open ? 'border-brand-400 ring-2 ring-brand-100' : 'border-ink-200 hover:border-ink-300'
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate">{displayLabel}</span>
          {provider && (
            <span className="shrink-0 rounded-md bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-500">
              {provider.label}
            </span>
          )}
        </span>
        <ChevronDown size={14} className="ml-2 shrink-0 text-ink-400" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[68px] z-40 max-h-[340px] overflow-y-auto rounded-2xl border border-ink-200 bg-white p-2 shadow-apple-xl">
          {ALL_PROVIDERS.map((p) => (
            <div key={p.id} className="mb-2 last:mb-0">
              <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">
                {p.label}
              </div>
              <div className="space-y-0.5">
                {p.models.map((m) => {
                  const isSelected = value.providerId === p.id && value.modelId === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        onChange({ providerId: p.id, modelId: m.id });
                        setOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-left text-sm transition',
                        isSelected
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-ink-700 hover:bg-ink-50'
                      )}
                    >
                      <span>{m.label}</span>
                      {isSelected && <Check size={14} className="text-brand-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
