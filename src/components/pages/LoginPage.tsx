'use client';

import { useState, useEffect } from 'react';
import { Loader2, Lock, User, AlertCircle, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import SideRays from '@/components/effects/SideRays';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils/cn';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const login = useAuthStore((s) => s.login);
  const error = useAuthStore((s) => s.error);

  // 自动聚焦用户名输入框
  useEffect(() => {
    const el = document.getElementById('login-username');
    el?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setSubmitting(true);
    try {
      await login(username.trim(), password);
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = username.trim().length > 0 && password.length > 0 && !submitting;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-900 px-6 py-10">
      {/* 背景 — SideRays 动态光束 */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <SideRays
          speed={2.5}
          rayColor1="#EAB308"
          rayColor2="#96c8ff"
          intensity={2}
          spread={2}
          origin="top-right"
          tilt={0}
          saturation={1.5}
          blend={0.75}
          falloff={1.6}
          opacity={1}
        />
      </div>

      {/* 卡片区域压暗 — 中心暗、边缘留出光束,保证玻璃卡内文字可读 */}
      <div
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{
          background:
            'radial-gradient(58% 52% at 50% 45%, rgba(20,20,22,0.78) 0%, rgba(20,20,22,0.42) 46%, rgba(20,20,22,0) 78%)',
        }}
      />

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center">
          <Logo size="lg" showText={false} />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">
            ROOT<span className="text-white/40">·</span>LINGO
          </h1>
          <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            AI Translation Studio
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-white/10 bg-white/[0.06] p-7 shadow-apple-xl backdrop-blur-2xl"
          style={{
            boxShadow:
              '0 24px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.10)',
          }}
        >
          <h2 className="mb-1 text-base font-semibold text-white">登录</h2>
          <p className="mb-5 text-xs text-white/50">内部团队工具,请输入分配给你的账号</p>

          <div className="mb-3">
            <label htmlFor="login-username" className="mb-1.5 block text-[11px] font-medium text-white/60">
              用户名
            </label>
            <div className="relative">
              <User
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
              />
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-white/40 focus:bg-white/[0.08] focus:ring-2 focus:ring-white/10"
                placeholder="输入用户名"
                disabled={submitting}
              />
            </div>
          </div>

          <div className="mb-5">
            <label htmlFor="login-password" className="mb-1.5 block text-[11px] font-medium text-white/60">
              密码
            </label>
            <div className="relative">
              <Lock
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
              />
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-white/40 focus:bg-white/[0.08] focus:ring-2 focus:ring-white/10"
                placeholder="输入密码"
                disabled={submitting}
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              <AlertCircle size={12} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className={cn(
              'flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition',
              canSubmit
                ? 'bg-white text-ink-900 shadow-[0_8px_24px_rgba(0,0,0,0.35)] hover:bg-white/90 active:scale-[0.99]'
                : 'cursor-not-allowed bg-white/10 text-white/40'
            )}
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> 登录中……
              </>
            ) : (
              '登录'
            )}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-white/45">
          <ShieldCheck size={11} className="text-white/55" />
          翻译内容通过 ROOT LINGO 无状态代理转发,不记录、不存储
        </div>
      </div>
    </main>
  );
}
