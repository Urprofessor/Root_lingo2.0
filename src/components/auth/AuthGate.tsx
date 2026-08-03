'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { LoginPage } from '@/components/pages/LoginPage';
import { LoginTransition } from '@/components/auth/LoginTransition';
import { BrandKineticScreen } from '@/components/effects/BrandKineticScreen';

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

  // 登录请求进行中(用户是从登录页点进来的):保持登录框显示——它自带
  // "登录中……" 的按钮态。白色加载页只留给 App 首次启动时的 session 校验。
  if (status === 'checking' && sawLogin.current) {
    return <LoginPage />;
  }

  if (status === 'idle' || status === 'checking') {
    return (
      <div className="fixed inset-0 z-50">
        <BrandKineticScreen />
      </div>
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
