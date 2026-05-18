'use client';

import { ChevronDown, SlidersHorizontal, UserCircle } from 'lucide-react';
import type { ActiveView } from '@/types/view';
import { useAuthStore } from '@/store/useAuthStore';

interface HeaderProps {
  onNavigate?: (view: ActiveView) => void;
}

export function Header({ onNavigate }: HeaderProps) {
  const username = useAuthStore((s) => s.username);

  return (
    <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-ink-200 bg-white/70 px-7 backdrop-blur-apple">
      <button
        type="button"
        className="group inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3.5 py-1.5 text-xs font-medium text-ink-700 shadow-apple-sm transition hover:border-brand-200"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inset-0 animate-ping rounded-full bg-brand-500 opacity-40" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
        </span>
        <span>团队模式 · 内容不留存</span>
        <ChevronDown size={13} className="text-ink-400 transition group-hover:text-ink-600" />
      </button>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onNavigate?.('api-keys')}
          className="inline-flex items-center gap-1.5 rounded-2xl border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 shadow-apple-sm transition hover:border-brand-300 hover:text-ink-900"
        >
          <UserCircle size={14} />
          {username || '账户'}
        </button>
        <button
          type="button"
          onClick={() => onNavigate?.('settings')}
          className="flex h-9 w-9 items-center justify-center rounded-2xl border border-ink-200 bg-white text-ink-600 shadow-apple-sm transition hover:text-ink-900"
          title="本地设置"
        >
          <SlidersHorizontal size={16} />
        </button>
      </div>
    </header>
  );
}
