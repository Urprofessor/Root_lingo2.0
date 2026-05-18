'use client';

import { UserCircle, LogOut, ShieldCheck, Server, KeyRound } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export function AccountPage() {
  const username = useAuthStore((s) => s.username);
  const logout = useAuthStore((s) => s.logout);

  async function handleLogout() {
    if (!confirm('确定登出?')) return;
    await logout();
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50">
          <UserCircle size={22} className="text-brand-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink-900">账户</h1>
          <p className="text-xs text-ink-500">登录信息与账户操作</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* 当前用户 */}
        <div className="rounded-3xl border border-ink-200 bg-white p-5 shadow-apple-sm">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
            当前登录
          </p>
          <p className="text-lg font-semibold text-ink-900">{username || '—'}</p>
          <p className="mt-1 text-xs text-ink-500">登录有效期 30 天,每次使用会自动续期</p>
        </div>

        {/* 模型来源说明 */}
        <div className="rounded-3xl border border-ink-200 bg-white p-5 shadow-apple-sm">
          <div className="mb-3 flex items-center gap-2">
            <Server size={14} className="text-brand-500" />
            <p className="text-sm font-semibold text-ink-900">模型来源</p>
          </div>
          <p className="mb-3 text-xs leading-5 text-ink-500">
            ROOT LINGO 已在后端配置好所有模型的 API Key,你无需自带 Key。
            翻译请求经无状态代理转发到对应厂商,不记录、不存储。
          </p>
          <ul className="space-y-1.5 text-xs text-ink-700">
            <li className="flex items-center gap-2">
              <KeyRound size={11} className="text-brand-500" />
              <span><b className="font-semibold">Anthropic</b> · 直连官方</span>
            </li>
            <li className="flex items-center gap-2">
              <KeyRound size={11} className="text-brand-500" />
              <span><b className="font-semibold">DeepSeek</b> · 直连官方</span>
            </li>
            <li className="flex items-center gap-2">
              <KeyRound size={11} className="text-brand-500" />
              <span><b className="font-semibold">OpenAI / Google / Qwen</b> · 通过 OpenRouter 转发</span>
            </li>
          </ul>
        </div>

        {/* 隐私说明 */}
        <div className="rounded-3xl border border-brand-100 bg-brand-50/50 p-5">
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck size={14} className="text-brand-600" />
            <p className="text-sm font-semibold text-ink-900">隐私与数据</p>
          </div>
          <ul className="space-y-1.5 text-xs leading-5 text-ink-700">
            <li>• 翻译内容仅在请求中存在,转发完成即释放</li>
            <li>• 后端不写日志、不入库、不缓存原文或译文</li>
            <li>• 草稿、设置、Session token 仅存在你当前浏览器</li>
            <li>• 登出后浏览器内的本地数据自动清空</li>
          </ul>
        </div>

        {/* 登出 */}
        <div className="rounded-3xl border border-ink-200 bg-white p-5 shadow-apple-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink-900">登出</p>
              <p className="text-xs text-ink-500">清除浏览器内的登录状态</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={13} /> 登出
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
