'use client';

/**
 * 顶栏 —— 目前为空的一条玻璃条(团队模式 / 账户 / 本地设置 已移除)。
 * 保留一条细顶栏用于上方留白与视觉一致;如需完全去掉可在 page.tsx 移除。
 */
export function Header() {
  return (
    <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-ink-200 bg-white/70 px-7 backdrop-blur-apple" />
  );
}
