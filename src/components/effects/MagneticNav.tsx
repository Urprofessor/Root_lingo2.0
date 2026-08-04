'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Magnetic Nav — vertical adaptation of the Magnetic Carousel.
 *
 * A column of text items that magnify (macOS-dock style) as the cursor nears:
 * the item under the cursor grows most, neighbors taper off by distance.
 * The active item stays highlighted; the others dim, echoing the carousel's
 * "open one, blur the rest" focus.
 *
 * Faithful to the source: a continuous JS easing loop (cur eases toward target
 * each frame, no CSS transition) drives the hover magnify so it tracks the
 * cursor smoothly. Magnify uses transform:scale so the layout boxes stay put
 * and the proximity centers never jitter.
 */

type MagneticNavProps = {
  items: string[];
  activeIndex?: number;
  onItemClick?: (index: number, label: string) => void;
  /** Muted color for a resting, non-active item. */
  textColor?: string;
  /** Color the item reaches at full proximity / when active. */
  accentColor?: string;
  /** Peak scale of the item directly under the cursor. */
  hoverScale?: number;
  /** Vertical falloff radius in px — how far the magnify reaches. */
  influence?: number;
  /** Gap between items in px. */
  itemGap?: number;
  /** Base font size in rem. */
  fontSize?: number;
  className?: string;
};

export default function MagneticNav({
  items,
  activeIndex,
  onItemClick,
  textColor = '#8a8a90',
  accentColor = '#ffffff',
  hoverScale = 1.42,
  influence = 96,
  itemGap = 22,
  fontSize = 1.02,
  className,
}: MagneticNavProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [factors, setFactors] = useState<number[]>(() => items.map(() => 0));

  // Continuous easing loop: cur eases toward target each frame (lerp 0.2).
  const targetRef = useRef<number[]>(items.map(() => 0));
  const curRef = useRef<number[]>(items.map(() => 0));
  const loopRef = useRef(0);

  const count = items.length;

  useEffect(() => {
    targetRef.current = items.map(() => 0);
    curRef.current = items.map(() => 0);
    setFactors(items.map(() => 0));
  }, [count]);

  useEffect(() => () => cancelAnimationFrame(loopRef.current), []);

  const startLoop = () => {
    if (loopRef.current) return;
    const step = () => {
      const tgt = targetRef.current;
      const cur = curRef.current;
      let moving = false;
      for (let i = 0; i < cur.length; i++) {
        const d = (tgt[i] ?? 0) - cur[i];
        if (Math.abs(d) > 0.001) {
          cur[i] += d * 0.2; // lerp toward target
          moving = true;
        } else {
          cur[i] = tgt[i] ?? 0;
        }
      }
      setFactors([...cur]);
      loopRef.current = moving ? requestAnimationFrame(step) : 0;
    };
    loopRef.current = requestAnimationFrame(step);
  };

  const setTargetFromCursor = (clientY: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cy = clientY - rect.top;
    // Item centers read from the live layout — transform:scale doesn't move
    // them, so the magnify peak tracks the cursor without feedback jitter.
    targetRef.current = itemRefs.current.map((node) => {
      if (!node) return 0;
      const center = node.offsetTop + node.offsetHeight / 2;
      const dist = Math.abs(cy - center);
      const f = Math.max(0, 1 - dist / influence);
      return f * f * (3 - 2 * f); // smoothstep falloff
    });
    startLoop();
  };

  const onMove = (e: React.MouseEvent) => setTargetFromCursor(e.clientY);

  const onLeave = () => {
    targetRef.current = items.map(() => 0);
    startLoop();
  };

  return (
    <nav
      ref={containerRef}
      className={className}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: itemGap,
        position: 'relative',
      }}
    >
      {items.map((label, i) => {
        const isActive = activeIndex === i;
        const f = factors[i] ?? 0;
        // Hover magnify comes from the cursor; the active item holds a
        // resting emphasis so it reads as selected even without hover.
        const emph = Math.max(f, isActive ? 1 : 0);
        const scale = 1 + f * (hoverScale - 1);
        return (
          <button
            key={`${label}-${i}`}
            ref={(node) => {
              itemRefs.current[i] = node;
            }}
            type="button"
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onItemClick?.(i, label)}
            style={{
              appearance: 'none',
              background: 'none',
              border: 'none',
              padding: 0,
              margin: 0,
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: `${fontSize}rem`,
              lineHeight: 1.15,
              fontWeight: isActive ? 600 : 400,
              letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
              transformOrigin: 'left center',
              transform: `scale(${scale.toFixed(4)})`,
              opacity: 0.55 + emph * 0.45,
              color: `color-mix(in srgb, ${accentColor} ${(emph * 100).toFixed(1)}%, ${textColor})`,
              // No CSS transition — the JS loop drives the magnify smoothly.
              transition: 'none',
              willChange: 'transform',
            }}
          >
            {label}
          </button>
        );
      })}
    </nav>
  );
}
