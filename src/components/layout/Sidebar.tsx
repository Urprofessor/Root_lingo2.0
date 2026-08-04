'use client';

import { UserCircle, ShieldCheck, LogOut } from 'lucide-react';
import { Logo } from './Logo';
import LineSidebar from '@/components/effects/LineSidebar';
import type { ActiveView } from '@/types/view';
import { useAuthStore } from '@/store/useAuthStore';

interface SidebarProps {
  activeView: ActiveView;
  onChange: (view: ActiveView) => void;
}

const NAV_ITEMS: { id: ActiveView; label: string }[] = [
  { id: 'workspace', label: '工作台' },
  { id: 'glossary', label: '术语库' },
  { id: 'templates', label: '提示词模板' },
  { id: 'api-keys', label: '账户' },
  { id: 'settings', label: '本地设置' },
];

export function Sidebar({ activeView, onChange }: SidebarProps) {
  const username = useAuthStore((s) => s.username);
  const logout = useAuthStore((s) => s.logout);

  const activeIndex = NAV_ITEMS.findIndex((n) => n.id === activeView);

  return (
    <aside className="flex w-[260px] shrink-0 flex-col border-r border-ink-200 bg-ink-50/60 px-5 py-6 backdrop-blur-apple">
      <div className="mb-9 px-2">
        <Logo size="md" showIcon={false} />
      </div>

      {/* key 随 activeView 变化,让高亮项与外部导航(Header 按钮)保持同步 */}
      <LineSidebar
        key={activeView}
        items={NAV_ITEMS.map((n) => n.label)}
        accentColor="#ffffff"
        textColor="#8a8a90"
        markerColor="#5a5a5e"
        showIndex
        showMarker
        proximityRadius={110}
        maxShift={16}
        falloff="smooth"
        markerLength={34}
        markerGap={0}
        tickScale={0.5}
        scaleTick
        itemGap={20}
        fontSize={0.98}
        smoothing={100}
        defaultActive={activeIndex >= 0 ? activeIndex : 0}
        onItemClick={(index) => onChange(NAV_ITEMS[index].id)}
      />

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
