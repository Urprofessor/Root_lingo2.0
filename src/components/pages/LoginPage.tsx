'use client';

import { useState, useEffect } from 'react';
import { Loader2, Lock, User, AlertCircle, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
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
    <main className="flex min-h-screen items-center justify-center bg-ink-100 px-6 py-10">
      {/* 背景装饰 - Apple 风格的微妙渐变 */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-brand-50 opacity-60 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[500px] rounded-full bg-brand-100 opacity-40 blur-[100px]" />
      </div>

      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center">
          <Logo size="lg" showText={false} />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink-900">
            ROOT<span className="text-brand-500">·</span>LINGO
          </h1>
          <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">
            AI Translation Studio
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-ink-200 bg-white p-7 shadow-apple-lg"
        >
          <h2 className="mb-1 text-base font-semibold text-ink-900">登录</h2>
          <p className="mb-5 text-xs text-ink-500">内部团队工具,请输入分配给你的账号</p>

          <div className="mb-3">
            <label htmlFor="login-username" className="mb-1.5 block text-[11px] font-medium text-ink-500">
              用户名
            </label>
            <div className="relative">
              <User
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
              />
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11 w-full rounded-2xl border border-ink-200 bg-white pl-9 pr-3 text-sm text-ink-800 outline-none placeholder:text-ink-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                placeholder="输入用户名"
                disabled={submitting}
              />
            </div>
          </div>

          <div className="mb-5">
            <label htmlFor="login-password" className="mb-1.5 block text-[11px] font-medium text-ink-500">
              密码
            </label>
            <div className="relative">
              <Lock
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
              />
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-2xl border border-ink-200 bg-white pl-9 pr-3 text-sm text-ink-800 outline-none placeholder:text-ink-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                placeholder="输入密码"
                disabled={submitting}
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
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
                ? 'bg-brand-500 text-white shadow-[0_4px_16px_rgba(52,199,89,0.35)] hover:bg-brand-600 active:scale-[0.99]'
                : 'cursor-not-allowed bg-ink-200 text-ink-400'
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

        <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-ink-500">
          <ShieldCheck size={11} className="text-brand-500" />
          翻译内容通过 ROOT LINGO 无状态代理转发,不记录、不存储
        </div>
      </div>
    </main>
  );
}
