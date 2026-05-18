'use client';

import { cn } from '@/lib/utils/cn';

interface PanelProps {
  number: string;
  title: string;
  children: React.ReactNode;
  className?: string;
  noBorderRight?: boolean;
}

export function Panel({ number, title, children, className, noBorderRight }: PanelProps) {
  return (
    <section
      className={cn(
        'flex min-w-0 flex-col overflow-y-auto bg-white px-7 py-6',
        !noBorderRight && 'border-r border-ink-200',
        className
      )}
    >
      <header className="mb-6 flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-[12px] font-bold text-white shadow-[0_2px_8px_rgba(52,199,89,0.35)]">
          {number}
        </span>
        <h2 className="text-base font-semibold tracking-tight text-ink-900">{title}</h2>
      </header>
      <div className="flex-1">{children}</div>
    </section>
  );
}
