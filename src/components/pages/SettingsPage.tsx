'use client';

import { Settings } from 'lucide-react';

export function SettingsPage() {
  return (
    <div className="flex h-full items-center justify-center p-10">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-50">
          <Settings size={36} className="text-brand-500" />
        </div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-600">
          第四批实现
        </p>
        <h2 className="mb-3 text-xl font-semibold text-ink-900">本地设置</h2>
        <p className="text-sm leading-6 text-ink-500">
          默认风格 / 默认目标语言 / 默认模型 / 缓存策略 / 一键清空所有本地数据。
        </p>
      </div>
    </div>
  );
}
