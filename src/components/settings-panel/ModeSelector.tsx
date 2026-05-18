'use client';

import { Zap, RefreshCw, Scale, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { TranslationMode } from '@/types';

interface ModeSelectorProps {
  value: TranslationMode;
  onChange: (mode: TranslationMode) => void;
}

const MODES: {
  id: TranslationMode;
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    id: 'quick',
    title: '急速模式',
    subtitle: 'Quick',
    description: '单模型直接翻译,最快,最低成本',
    icon: Zap,
  },
  {
    id: 'single',
    title: '单模型模式',
    subtitle: 'Single',
    description: '同一模型翻译 → 自审 → 优化',
    icon: RefreshCw,
  },
  {
    id: 'multi',
    title: '多模型模式',
    subtitle: 'Multi',
    description: '两模型翻译 + 裁判模型融合',
    icon: Scale,
  },
];

export function ModeSelector({ value, onChange }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {MODES.map((mode) => {
        const Icon = mode.icon;
        const active = value === mode.id;
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onChange(mode.id)}
            className={cn(
              'group relative overflow-hidden rounded-2xl border p-3.5 text-left transition-all',
              active
                ? 'border-brand-400 bg-brand-50/60 shadow-[0_4px_16px_rgba(52,199,89,0.18)]'
                : 'border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50/60'
            )}
          >
            <div
              className={cn(
                'mb-2.5 inline-flex h-7 w-7 items-center justify-center rounded-xl transition',
                active ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-600'
              )}
            >
              <Icon size={15} />
            </div>
            <h3 className={cn('text-sm font-semibold', active ? 'text-brand-700' : 'text-ink-900')}>
              {mode.title}
            </h3>
            <p
              className={cn(
                'text-[10px] font-bold uppercase tracking-[0.12em]',
                active ? 'text-brand-600' : 'text-ink-400'
              )}
            >
              {mode.subtitle}
            </p>
            <p className="mt-1.5 text-[11px] leading-4 text-ink-500">{mode.description}</p>

            {active && (
              <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-brand-500 shadow-[0_0_0_3px_rgba(52,199,89,0.2)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
