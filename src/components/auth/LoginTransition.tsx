'use client';

import { useEffect, useState } from 'react';
import KineticTextGrid from '@/components/effects/KineticTextGrid';

/** How long the kinetic text plays before it fades away to reveal the app. */
const PLAY_MS = 2200;
/** Fade-out duration of the overlay. */
const FADE_MS = 650;

/**
 * Full-screen overlay that plays the kinetic "ROOT LINGO" reveal after a
 * successful login, then fades out to hand off to the authenticated app.
 */
export function LoginTransition({ onComplete }: { onComplete: () => void }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const playTimer = setTimeout(() => setFading(true), PLAY_MS);
    const doneTimer = setTimeout(onComplete, PLAY_MS + FADE_MS);
    return () => {
      clearTimeout(playTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[100]"
      style={{
        opacity: fading ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease`,
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      <KineticTextGrid
        text="ROOT LINGO"
        backgroundColor="#1d1d1f"
        textColor="#ffffff"
        rowCount={5}
        repeatCount={5}
        expandDurationSec={0.9}
        holdDurationSec={0.8}
        font={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
          fontWeight: 700,
          fontSize: 'clamp(28px, 6vw, 64px)',
          lineHeight: '1.5em',
          letterSpacing: '-0.02em',
          textAlign: 'left',
        }}
      />
    </div>
  );
}
