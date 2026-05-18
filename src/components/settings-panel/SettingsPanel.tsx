'use client';

import { ShieldCheck, ArrowLeftRight, Palette } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { SimpleSelect } from '@/components/ui/SimpleSelect';
import { ModeSelector } from './ModeSelector';
import { ModelPicker } from './ModelPicker';
import { LanguageMultiSelect } from './LanguageMultiSelect';
import { SourceLanguagePicker } from './SourceLanguagePicker';
import { StyleSlider } from './StyleSliders';
import { PromptTemplateMultiSelect } from './PromptTemplateMultiSelect';
import { useTranslationStore } from '@/store/useTranslationStore';
import { cn } from '@/lib/utils/cn';

export function SettingsPanel() {
  const settings = useTranslationStore((s) => s.settings);
  const setMode = useTranslationStore((s) => s.setMode);
  const setSourceLanguage = useTranslationStore((s) => s.setSourceLanguage);
  const setTargetLanguages = useTranslationStore((s) => s.setTargetLanguages);
  const toggleTargetLanguage = useTranslationStore((s) => s.toggleTargetLanguage);
  const setPrimaryModel = useTranslationStore((s) => s.setPrimaryModel);
  const setSecondaryModel = useTranslationStore((s) => s.setSecondaryModel);
  const setJudgeModel = useTranslationStore((s) => s.setJudgeModel);
  const setProfessional = useTranslationStore((s) => s.setProfessional);
  const setWarmth = useTranslationStore((s) => s.setWarmth);
  const setGlossaryId = useTranslationStore((s) => s.setGlossaryId);
  const setTemplateIds = useTranslationStore((s) => s.setTemplateIds);
  const toggleTemplateId = useTranslationStore((s) => s.toggleTemplateId);
  const setCustomRequirement = useTranslationStore((s) => s.setCustomRequirement);
  const setStyleEnabled = useTranslationStore((s) => s.setStyleEnabled);
  const setSafetyEnabled = useTranslationStore((s) => s.setSafetyEnabled);

  const isMulti = settings.mode === 'multi';
  const isQuick = settings.mode === 'quick';
  // 风格 / 模板 仅在 Single / Multi 模式可见
  const showStyleSection = !isQuick;
  const showTemplateSection = !isQuick;

  return (
    <Panel number="2" title="翻译设置">
      <SectionTitle title="工作模式" />
      <ModeSelector value={settings.mode} onChange={setMode} />

      <SectionTitle title="模型设置" className="mt-6" />
      <div className="space-y-3">
        <ModelPicker
          label={isMulti ? '翻译模型 A' : '翻译模型'}
          value={settings.primaryModel}
          onChange={setPrimaryModel}
        />
        {isMulti && (
          <>
            <ModelPicker
              label="翻译模型 B"
              value={settings.secondaryModel || settings.primaryModel}
              onChange={setSecondaryModel}
            />
            <ModelPicker
              label="裁判模型"
              value={settings.judgeModel || settings.primaryModel}
              onChange={setJudgeModel}
            />
          </>
        )}
      </div>

      <SectionTitle title="语言设置" className="mt-6" />
      <div className="grid grid-cols-[1fr_auto_1.2fr] items-end gap-2">
        <SourceLanguagePicker value={settings.sourceLanguage} onChange={setSourceLanguage} />
        <button
          type="button"
          className="mb-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border border-ink-200 bg-white text-ink-500 shadow-apple-sm transition hover:border-ink-300 hover:text-ink-700"
          aria-label="交换语言"
        >
          <ArrowLeftRight size={14} />
        </button>
        <LanguageMultiSelect
          label="目标语言"
          selected={settings.targetLanguages}
          onToggle={toggleTargetLanguage}
          onChange={setTargetLanguages}
        />
      </div>

      {/* 风格与语气 — Quick 模式下完全隐藏 */}
      {showStyleSection && (
        <>
          <div className="mt-6 mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Palette size={13} className={cn(settings.styleEnabled ? 'text-brand-500' : 'text-ink-400')} />
              <p className="text-xs font-semibold tracking-wide text-ink-800">风格与语气</p>
            </div>
            <Toggle checked={settings.styleEnabled} onChange={setStyleEnabled} small />
          </div>
          <div
            className={cn(
              'space-y-3 rounded-2xl border px-4 py-3.5 transition',
              settings.styleEnabled
                ? 'border-ink-200 bg-ink-50/40'
                : 'border-ink-200 bg-ink-50/30 opacity-50 pointer-events-none'
            )}
          >
            <StyleSlider
              label="专业度"
              leftLabel="通用"
              rightLabel="专业"
              value={settings.professional}
              onChange={setProfessional}
            />
            <StyleSlider
              label="温柔度"
              leftLabel="直接"
              rightLabel="温柔"
              value={settings.warmth}
              onChange={setWarmth}
            />
          </div>
        </>
      )}

      <SectionTitle title={showTemplateSection ? '术语库与模板' : '术语库'} className="mt-6" />
      <div className="grid grid-cols-1 gap-3">
        <SimpleSelect
          label="术语库"
          value={settings.glossaryId}
          onChange={setGlossaryId}
          options={[
            { id: 'momcozy', label: 'Momcozy 全球术语库', description: '704 条 · 母婴产品 · V1.0' },
            { id: 'none', label: '不使用', description: '不注入任何术语约束' },
          ]}
        />
        {showTemplateSection && (
          <PromptTemplateMultiSelect
            selected={settings.templateIds}
            onToggle={toggleTemplateId}
            onChange={setTemplateIds}
            targetLangs={settings.targetLanguages}
            sourceLang={settings.sourceLanguage}
          />
        )}
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-[11px] font-medium text-ink-500">自定义需求(可选)</label>
        <textarea
          value={settings.customRequirement}
          onChange={(e) => setCustomRequirement(e.target.value)}
          placeholder="如:保留原文段落结构 / 数字保留两位小数 / 避免口语化表达..."
          className="h-20 w-full resize-none rounded-2xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm leading-5 text-ink-800 outline-none placeholder:text-ink-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={16} className="text-brand-600" />
          <div>
            <p className="text-sm font-semibold text-ink-900">安全边界</p>
            <p className="text-[11px] text-ink-500">防编造、保留数字与法律结构</p>
          </div>
        </div>
        <Toggle checked={settings.safetyEnabled} onChange={setSafetyEnabled} />
      </div>
    </Panel>
  );
}

function SectionTitle({ title, className }: { title: string; className?: string }) {
  return (
    <p className={cn('mb-2.5 text-xs font-semibold tracking-wide text-ink-800', className)}>
      {title}
    </p>
  );
}

function Toggle({
  checked,
  onChange,
  small = false,
}: {
  checked: boolean;
  onChange: (b: boolean) => void;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
        small ? 'h-5 w-9' : 'h-6 w-11',
        checked ? 'bg-brand-500' : 'bg-ink-300'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block transform rounded-full bg-white shadow ring-0 transition duration-200 ease-out',
          small ? 'h-4 w-4' : 'h-5 w-5',
          checked ? (small ? 'translate-x-4' : 'translate-x-5') : 'translate-x-0'
        )}
      />
    </button>
  );
}
