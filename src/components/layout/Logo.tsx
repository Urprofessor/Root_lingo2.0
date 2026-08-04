'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import ShinyText from '@/components/effects/ShinyText';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

/**
 * ROOT LINGO Logo
 *
 * 优先加载 /brand/logo.png(你上传的品牌图),
 * 如果该文件不存在或加载失败,自动回退到内置的绿色 SVG 信号波。
 *
 * 图标 + 文字的组合:左边是图,右边是 "ROOT·LINGO" 文字。
 */
export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const dimensions = {
    sm: { icon: 28, gap: 8, text: 'text-base' },
    md: { icon: 36, gap: 10, text: 'text-lg' },
    lg: { icon: 56, gap: 14, text: 'text-2xl' },
  };
  const d = dimensions[size];

  return (
    <div className={cn('flex items-center', className)} style={{ gap: d.gap }}>
      <LogoIcon size={d.icon} />
      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className={cn('font-semibold tracking-tight', d.text)}
            style={{ letterSpacing: '-0.02em' }}
          >
            <ShinyText
              text="ROOT·LINGO"
              color="#1d1d1f"
              shineColor="#34C759"
              speed={3}
              spread={120}
            />
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
 * Logo 图标 — 优先 PNG,失败回退 SVG
 */
export function LogoIcon({ size = 36, className }: { size?: number; className?: string }) {
  const [pngFailed, setPngFailed] = useState(false);

  if (!pngFailed) {
    return (
      // 用原生 img 而非 next/image:静态导出 + 简单需求,不需要优化管线
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/brand/logo.png"
        alt="ROOT LINGO"
        width={size}
        height={size}
        onError={() => setPngFailed(true)}
        className={cn('block object-contain', className)}
        style={{ width: size, height: size }}
      />
    );
  }

  // 回退:内置 SVG 绿色信号波
  return <FallbackSvgIcon size={size} className={className} />;
}

/**
 * 内置回退图标 — 当 /brand/logo.png 不存在时使用
 */
function FallbackSvgIcon({ size = 36, className }: { size?: number; className?: string }) {
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
        <radialGradient id="rl-dot-fb" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#5DDC7A" />
          <stop offset="60%" stopColor="#34C759" />
          <stop offset="100%" stopColor="#28A745" />
        </radialGradient>
        <linearGradient id="rl-wave-fb" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34C759" />
          <stop offset="100%" stopColor="#5DDC7A" />
        </linearGradient>
        <filter id="rl-glow-fb" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.8" />
        </filter>
      </defs>
      <circle cx="24" cy="28" r="14" fill="#34C759" opacity="0.06" />
      <path
        d="M 7 28 A 17 17 0 0 1 41 28"
        stroke="url(#rl-wave-fb)"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
        opacity="0.55"
      />
      <path
        d="M 13 28 A 11 11 0 0 1 35 28"
        stroke="url(#rl-wave-fb)"
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.78"
      />
      <path
        d="M 18.5 28 A 5.5 5.5 0 0 1 29.5 28"
        stroke="url(#rl-wave-fb)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="24" cy="28" r="2.6" fill="url(#rl-dot-fb)" filter="url(#rl-glow-fb)" />
      <circle cx="24" cy="28" r="2.2" fill="#34C759" />
    </svg>
  );
}
