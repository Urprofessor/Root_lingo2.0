'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, FileText, AlertCircle } from 'lucide-react';
import { ALL_PROMPTS, filterPromptsForLangs } from '@/lib/prompts/loader';
import { cn } from '@/lib/utils/cn';

interface PromptTemplateMultiSelectProps {
  selected: string[];
  onToggle: (id: string) => void;
  onChange: (ids: string[]) => void;
  /** 当前目标语言数组,用于过滤"适用"的模板 */
  targetLangs: string[];
  /** 当前源语言 */
  sourceLang: string;
}

export function PromptTemplateMultiSelect({
  selected,
  onToggle,
  onChange,
  targetLangs,
  sourceLang,
}: PromptTemplateMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const applicable = useMemo(
    () => filterPromptsForLangs(targetLangs, sourceLang),
    [targetLangs, sourceLang]
  );

  // 把"不适用的"也展示出来,但置灰
  const otherPrompts = useMemo(
    () => ALL_PROMPTS.filter((p) => !applicable.find((a) => a.id === p.id)),
    [applicable]
  );

  const totalCount = ALL_PROMPTS.length;

  return (
    <div className="relative" ref={ref}>
      <label className="mb-1.5 block text-[11px] font-medium text-ink-500">提示词模板</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-2xl border bg-white px-3.5 text-sm font-medium text-ink-800 shadow-apple-sm transition',
          open ? 'border-brand-400 ring-2 ring-brand-100' : 'border-ink-200 hover:border-ink-300'
        )}
      >
        <span className="flex items-center gap-2">
          {selected.length > 0 ? (
            <>
              <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                {selected.length}
              </span>
              <span>已启用 {selected.length} 个模板</span>
            </>
          ) : (
            <>
              <FileText size={13} className="text-ink-400" />
              <span className="text-ink-500">未选择(可选 0-{totalCount} 个)</span>
            </>
          )}
        </span>
        <ChevronDown size={14} className="text-ink-400" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[68px] z-30 max-h-[380px] overflow-y-auto rounded-2xl border border-ink-200 bg-white p-2 shadow-apple-xl">
          {totalCount === 0 && (
            <div className="px-3 py-5 text-center text-xs text-ink-400">
              暂无可用模板。在 src/data/prompts/ 添加 .md 文件即可
            </div>
          )}

          {applicable.length > 0 && (
            <>
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">
                适用于当前语言
              </p>
              <div className="space-y-1">
                {applicable.map((p) => {
                  const checked = selected.includes(p.id);
                  const isNonTranslation = p.category === 'writing' || (p.tags || []).includes('非翻译');
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onToggle(p.id)}
                      className={cn(
                        'flex w-full items-start gap-2 rounded-xl px-2.5 py-2 text-left transition',
                        checked ? 'bg-brand-50' : 'hover:bg-ink-50'
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition',
                          checked
                            ? 'bg-brand-500 text-white shadow-[0_0_0_3px_rgba(52,199,89,0.15)]'
                            : 'border border-ink-300'
                        )}
                      >
                        {checked && <Check size={13} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'truncate text-sm font-medium',
                              checked ? 'text-brand-700' : 'text-ink-800'
                            )}
                          >
                            {p.name}
                          </span>
                          {isNonTranslation && (
                            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                              <AlertCircle size={9} />
                              非翻译
                            </span>
                          )}
                        </span>
                        {p.description && (
                          <span className="mt-0.5 block text-[11px] leading-4 text-ink-500">
                            {p.description}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {otherPrompts.length > 0 && (
            <>
              <p className="mb-1 mt-3 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">
                其他模板(可能不适用当前语言)
              </p>
              <div className="space-y-1">
                {otherPrompts.map((p) => {
                  const checked = selected.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onToggle(p.id)}
                      className={cn(
                        'flex w-full items-start gap-2 rounded-xl px-2.5 py-2 text-left transition',
                        checked ? 'bg-brand-50' : 'opacity-60 hover:bg-ink-50 hover:opacity-100'
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition',
                          checked
                            ? 'bg-brand-500 text-white'
                            : 'border border-ink-300'
                        )}
                      >
                        {checked && <Check size={13} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="truncate text-sm font-medium text-ink-700">{p.name}</span>
                        {p.description && (
                          <span className="mt-0.5 block text-[11px] leading-4 text-ink-500">
                            {p.description}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {selected.length > 0 && (
            <div className="mt-2 border-t border-ink-100 pt-2">
              <button
                type="button"
                onClick={() => onChange([])}
                className="w-full rounded-xl px-3 py-1.5 text-xs font-medium text-ink-500 hover:bg-ink-50 hover:text-ink-700"
              >
                清空所有选择
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
