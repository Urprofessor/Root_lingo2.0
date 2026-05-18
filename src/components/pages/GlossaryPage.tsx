'use client';

import { BookOpen } from 'lucide-react';

export function GlossaryPage() {
  return (
    <PagePlaceholder
      icon={<BookOpen size={36} className="text-brand-500" />}
      title="术语库管理"
      subtitle="第四批实现"
      description="内置 Momcozy 全球术语库(704 条),支持导入自定义 xlsx,按品线/层级筛选,启停状态切换。"
    />
  );
}

function PagePlaceholder({
  icon,
  title,
  subtitle,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
}) {
  return (
    <div className="flex h-full items-center justify-center p-10">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-50">
          {icon}
        </div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-600">
          {subtitle}
        </p>
        <h2 className="mb-3 text-xl font-semibold text-ink-900">{title}</h2>
        <p className="text-sm leading-6 text-ink-500">{description}</p>
      </div>
    </div>
  );
}
