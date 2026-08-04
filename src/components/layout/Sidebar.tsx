'use client';

import { Logo } from './Logo';
import LineSidebar from '@/components/effects/LineSidebar';
import type { ActiveView } from '@/types/view';

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
  const activeIndex = NAV_ITEMS.findIndex((n) => n.id === activeView);

  return (
    <aside className="flex w-[260px] shrink-0 flex-col border-r border-ink-200 bg-ink-50/60 px-5 py-6 backdrop-blur-apple">
      <div className="mb-9 px-2">
        <Logo size="md" showIcon={false} />
      </div>

      {/* key 随 activeView 变化,让高亮项与外部导航保持同步 */}
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
    </aside>
  );
}
