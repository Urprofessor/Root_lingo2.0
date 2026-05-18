'use client';

import { cn } from '@/lib/utils/cn';

interface StyleSliderProps {
  label: string;
  leftLabel: string;
  rightLabel: string;
  value: number;
  onChange: (v: number) => void;
}

export function StyleSlider({ label, leftLabel, rightLabel, value, onChange }: StyleSliderProps) {
  return (
    <div className="grid grid-cols-[56px_36px_1fr_36px] items-center gap-2.5">
      <span className="text-xs font-semibold text-ink-700">{label}</span>
      <span className="text-[10px] text-ink-400">{leftLabel}</span>
      <div className="relative">
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ '--val': `${value}%` } as React.CSSProperties}
          className="w-full"
        />
      </div>
      <span className="text-[10px] text-ink-400">{rightLabel}</span>
    </div>
  );
}
