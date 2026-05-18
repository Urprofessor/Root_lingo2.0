import { cn } from '@/lib/utils/cn';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

/**
 * ROOT LINGO Logo
 *
 * 设计概念:
 * - 一个发散的"信号波"作为根系/语言的视觉隐喻
 * - 绿色 Apple System Green (#34C759) 作为品牌主色
 * - 三层弧形波纹由小到大,中心一个发光圆点
 * - 字体使用 SF Pro 风格的 system font,字距收紧
 *
 * 用法:
 *   <Logo size="md" />           // 完整 logo
 *   <Logo size="sm" showText={false} />  // 仅图标
 */
export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const dimensions = {
    sm: { icon: 28, gap: 8, text: 'text-base' },
    md: { icon: 36, gap: 10, text: 'text-lg' },
    lg: { icon: 48, gap: 14, text: 'text-2xl' },
  };
  const d = dimensions[size];

  return (
    <div className={cn('flex items-center', className)} style={{ gap: d.gap }}>
      <LogoIcon size={d.icon} />
      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className={cn(
              'font-semibold tracking-tight text-ink-900',
              d.text
            )}
            style={{ letterSpacing: '-0.02em' }}
          >
            ROOT<span className="text-brand-500">·</span>LINGO
          </span>
          {size !== 'sm' && (
            <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-500">
              AI Translation Studio
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 单独的 logo 图标 — 绿色信号波
 */
export function LogoIcon({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('block', className)}
      aria-label="ROOT LINGO"
    >
      <defs>
        {/* 渐变 - 内部圆点,亮一点的绿 */}
        <radialGradient id="rl-dot" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#5DDC7A" />
          <stop offset="60%" stopColor="#34C759" />
          <stop offset="100%" stopColor="#28A745" />
        </radialGradient>
        {/* 渐变 - 波纹,边缘略淡 */}
        <linearGradient id="rl-wave" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34C759" />
          <stop offset="100%" stopColor="#5DDC7A" />
        </linearGradient>
        {/* 微微的光晕 */}
        <filter id="rl-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.8" />
        </filter>
      </defs>

      {/* 背景柔光 */}
      <circle cx="24" cy="28" r="14" fill="#34C759" opacity="0.06" />

      {/* 外层弧 */}
      <path
        d="M 7 28 A 17 17 0 0 1 41 28"
        stroke="url(#rl-wave)"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
        opacity="0.55"
      />

      {/* 中层弧 */}
      <path
        d="M 13 28 A 11 11 0 0 1 35 28"
        stroke="url(#rl-wave)"
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.78"
      />

      {/* 内层弧 */}
      <path
        d="M 18.5 28 A 5.5 5.5 0 0 1 29.5 28"
        stroke="url(#rl-wave)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* 中心圆点 */}
      <circle cx="24" cy="28" r="2.6" fill="url(#rl-dot)" filter="url(#rl-glow)" />
      <circle cx="24" cy="28" r="2.2" fill="#34C759" />
    </svg>
  );
}
