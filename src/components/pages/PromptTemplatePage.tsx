'use client';

import { useState } from 'react';
import { FileText, AlertCircle, Tag, ChevronRight, ChevronDown, Copy, Check } from 'lucide-react';
import { ALL_PROMPTS } from '@/lib/prompts/loader';
import { getLanguageLabel } from '@/lib/utils/languages';
import { cn } from '@/lib/utils/cn';

export function PromptTemplatePage() {
  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50">
          <FileText size={22} className="text-brand-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink-900">提示词模板</h1>
          <p className="text-xs text-ink-500">
            内置 {ALL_PROMPTS.length} 个团队模板,可在工作台多选启用
          </p>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-ink-200 bg-ink-50/40 p-4 text-xs leading-5 text-ink-600">
        <p className="mb-1.5 font-semibold text-ink-800">如何添加新模板</p>
        <p>
          在仓库 <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px]">src/data/prompts/</code> 添加一个 <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px]">.md</code> 文件,
          文件头部用 YAML frontmatter 写元数据(id、name、description、targetLangs 等)。
          推送到 GitHub 后 Vercel 会自动重新部署,新模板就出现在这里。
        </p>
      </div>

      {ALL_PROMPTS.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-ink-300 bg-ink-50/40 px-6 py-10 text-center text-sm text-ink-500">
          暂无模板
        </div>
      ) : (
        <div className="space-y-3">
          {ALL_PROMPTS.map((p) => (
            <PromptCard key={p.id} prompt={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function PromptCard({
  prompt,
}: {
  prompt: {
    id: string;
    name: string;
    description?: string;
    category?: string;
    sourceLang?: string;
    targetLangs?: string[];
    tags?: string[];
    content: string;
  };
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const isNonTranslation = prompt.category === 'writing' || (prompt.tags || []).includes('非翻译');

  async function copyContent() {
    try {
      await navigator.clipboard.writeText(prompt.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <div className="rounded-3xl border border-ink-200 bg-white shadow-apple-sm">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-start gap-3 px-5 py-4 text-left"
      >
        <span className="mt-0.5 text-ink-400">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-ink-900">{prompt.name}</span>
            {isNonTranslation && (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                <AlertCircle size={9} />
                非翻译
              </span>
            )}
            {prompt.category && (
              <span className="rounded-md bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                {prompt.category}
              </span>
            )}
          </span>
          {prompt.description && (
            <span className="mt-1 block text-xs leading-5 text-ink-500">{prompt.description}</span>
          )}
          <span className="mt-2 flex flex-wrap gap-1.5">
            {prompt.sourceLang && (
              <Chip icon={<Tag size={9} />} label={`源: ${getLanguageLabel(prompt.sourceLang)}`} />
            )}
            {prompt.targetLangs && prompt.targetLangs.length > 0 && (
              <Chip
                icon={<Tag size={9} />}
                label={`目标: ${prompt.targetLangs.map(getLanguageLabel).join(' / ')}`}
              />
            )}
            <Chip icon={null} label={`id: ${prompt.id}`} mono />
          </span>
        </span>
      </button>

      {expanded && (
        <div className="border-t border-ink-100 px-5 py-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
              模板内容
            </p>
            <button
              type="button"
              onClick={copyContent}
              className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-2 py-1 text-[11px] font-medium text-ink-600 transition hover:border-brand-300 hover:text-brand-700"
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              {copied ? '已复制' : '复制'}
            </button>
          </div>
          <pre className="max-h-[480px] overflow-y-auto whitespace-pre-wrap break-words rounded-2xl bg-ink-50 p-4 font-mono text-[11px] leading-5 text-ink-700">
            {prompt.content}
          </pre>
        </div>
      )}
    </div>
  );
}

function Chip({ icon, label, mono }: { icon: React.ReactNode; label: string; mono?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border border-ink-200 bg-white px-1.5 py-0.5 text-[10px] text-ink-600',
        mono && 'font-mono'
      )}
    >
      {icon}
      {label}
    </span>
  );
}
