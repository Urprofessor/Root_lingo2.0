'use client';

import { Home, BookOpen, FileText, UserCircle, Settings, ShieldCheck, LogOut, Languages, FileSpreadsheet } from 'lucide-react';
import { Logo } from './Logo';
import { cn } from '@/lib/utils/cn';
import type { ActiveView } from '@/types/view';
import { useAuthStore } from '@/store/useAuthStore';

interface SidebarProps {
  activeView: ActiveView;
  onChange: (view: ActiveView) => void;
}

const NAV_ITEMS: { id: ActiveView; icon: React.ReactNode; label: string }[] = [
  { id: 'workspace', icon: <Home size={18} />, label: '工作台' },
  { id: 'tips', icon: <Languages size={18} />, label: 'Tips 本地化' },
  { id: 'excel', icon: <FileSpreadsheet size={18} />, label: 'Excel 翻译' },
  { id: 'glossary', icon: <BookOpen size={18} />, label: '术语库' },
  { id: 'templates', icon: <FileText size={18} />, label: '提示词模板' },
  { id: 'api-keys', icon: <UserCircle size={18} />, label: '账户' },
  { id: 'settings', icon: <Settings size={18} />, label: '本地设置' },
];

export function Sidebar({ activeView, onChange }: SidebarProps) {
  const username = useAuthStore((s) => s.username);
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside className="flex w-[260px] shrink-0 flex-col border-r border-ink-200 bg-ink-50/60 px-5 py-6">
      <div className="mb-9 px-2">
        <Logo size="md" showIcon={false} />
      </div>

      <nav className="space-y-1.5">
        {NAV_ITEMS.map((item) => (
          <SidebarItem
            key={item.id}
            active={activeView === item.id}
            icon={item.icon}
            label={item.label}
            onClick={() => onChange(item.id)}
          />
        ))}
      </nav>

      <div className="mt-auto space-y-3">
        <PrivacyCard />

        {/* 当前用户 + 登出 */}
        <div className="rounded-3xl border border-ink-200 bg-white p-3.5 shadow-apple-sm">
          <div className="mb-2.5 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-50">
              <UserCircle size={14} className="text-brand-600" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-ink-900">{username || '—'}</p>
              <p className="text-[10px] text-ink-500">已登录</p>
            </div>
          </div>
          <button
            onClick={async () => {
              if (confirm('确定登出?')) await logout();
            }}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-ink-200 bg-white px-2 py-1.5 text-[11px] font-medium text-ink-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={11} /> 登出
          </button>
        </div>
      </div>
    </aside>
  );
}

function SidebarItem({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition',
        active
          ? 'bg-white text-ink-900 shadow-apple-sm'
          : 'text-ink-600 hover:bg-white/60 hover:text-ink-900'
      )}
    >
      <span
        className={cn(
          'transition-colors',
          active ? 'text-brand-500' : 'text-ink-500 group-hover:text-ink-700'
        )}
      >
        {icon}
      </span>
      {label}
    </button>
  );
}

function PrivacyCard() {
  return (
    <div className="rounded-3xl border border-ink-200 bg-white p-4 shadow-apple-sm">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-900">
        <ShieldCheck size={16} className="text-brand-500" />
        隐私与安全
      </div>
      <p className="mb-3 text-xs leading-5 text-ink-500">
        翻译内容通过无状态代理转发,不存储、不记录。草稿仅在你当前浏览器。
      </p>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold tracking-wide text-brand-700">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-500 shadow-[0_0_0_3px_rgba(52,199,89,0.18)]" />
        TEAM ACCESS
      </span>
    </div>
  );
}
