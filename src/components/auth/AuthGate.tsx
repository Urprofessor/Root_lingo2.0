'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { LoginPage } from '@/components/pages/LoginPage';
import { LoginTransition } from '@/components/auth/LoginTransition';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const checkSession = useAuthStore((s) => s.checkSession);

  // Whether the login page was actually shown — so the reveal animation only
  // plays after an explicit sign-in, not on a silent session restore/refresh.
  const sawLogin = useRef(false);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (status === 'idle') checkSession();
  }, [status, checkSession]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      sawLogin.current = true;
    } else if (status === 'authenticated' && sawLogin.current) {
      sawLogin.current = false;
      setTransitioning(true);
    }
  }, [status]);

  if (status === 'idle' || status === 'checking') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-100">
        <Logo size="lg" showText={false} />
        <div className="flex items-center gap-2 text-sm text-ink-500">
          <Loader2 size={14} className="animate-spin text-brand-500" />
          <span>正在加载……</span>
        </div>
      </main>
    );
  }

  if (status === 'unauthenticated') {
    return <LoginPage />;
  }

  return (
    <>
      {children}
      {transitioning && (
        <LoginTransition onComplete={() => setTransitioning(false)} />
      )}
    </>
  );
}
