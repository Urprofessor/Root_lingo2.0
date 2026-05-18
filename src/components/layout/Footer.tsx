'use client';

import { ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="flex h-[60px] shrink-0 items-center justify-between border-t border-ink-200 bg-ink-50/60 px-7 text-xs text-ink-500">
      <div className="flex items-center gap-2">
        <ShieldCheck size={14} className="text-brand-500" />
        <span>
          翻译内容通过 ROOT LINGO 无状态代理转发到对应 LLM 厂商,不记录、不存储。草稿与设置仅存于你当前浏览器。
        </span>
      </div>
      <button className="rounded-2xl border border-ink-200 bg-white px-3.5 py-1.5 font-medium text-brand-600 shadow-apple-sm transition hover:text-brand-700">
        了解更多 →
      </button>
    </footer>
  );
}
