'use client';

import { FileText } from 'lucide-react';

export function PromptTemplatePage() {
  return (
    <div className="flex h-full items-center justify-center p-10">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-50">
          <FileText size={36} className="text-brand-500" />
        </div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-600">
          第四批实现
        </p>
        <h2 className="mb-3 text-xl font-semibold text-ink-900">提示词模板管理</h2>
        <p className="text-sm leading-6 text-ink-500">
          内置专业/通用/温柔/直接等模板,支持自定义提示词;专业度与温柔度的参数化 Prompt 由你之后填入。
        </p>
      </div>
    </div>
  );
}
