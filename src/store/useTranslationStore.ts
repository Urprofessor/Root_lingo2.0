'use client';

import { create } from 'zustand';
import type {
  TranslationMode,
  TranslationSettings,
  InputContent,
  TranslationResult,
  ModelRef,
} from '@/types';
import {
  DEFAULT_MODEL,
  DEFAULT_SECONDARY_MODEL,
  DEFAULT_JUDGE_MODEL,
} from '@/lib/utils/models';

interface TranslationStore {
  // 工作台输入模式 — 单文件 vs 批量
  inputMode: InputMode;
  setInputMode: (mode: InputMode) => void;

  // 输入
  input: InputContent;
  setInput: (input: InputContent) => void;
  setInputText: (text: string) => void;

  // 设置
  settings: TranslationSettings;
  setMode: (mode: TranslationMode) => void;
  setSourceLanguage: (lang: string) => void;
  setTargetLanguages: (langs: string[]) => void;
  toggleTargetLanguage: (lang: string) => void;
  setPrimaryModel: (model: ModelRef) => void;
  setSecondaryModel: (model: ModelRef) => void;
  setJudgeModel: (model: ModelRef) => void;
  setProfessional: (v: number) => void;
  setWarmth: (v: number) => void;
  setGlossaryId: (id: string) => void;
  setTemplateIds: (ids: string[]) => void;
  toggleTemplateId: (id: string) => void;
  setCustomRequirement: (text: string) => void;
  setStyleEnabled: (enabled: boolean) => void;
  setSafetyEnabled: (enabled: boolean) => void;

  // 结果
  result: TranslationResult | null;
  setResult: (result: TranslationResult | null) => void;

  // 翻译状态
  isTranslating: boolean;
  setIsTranslating: (b: boolean) => void;

  error: string | null;
  setError: (e: string | null) => void;

  progress: { stage: string; lang?: string } | null;
  setProgress: (p: { stage: string; lang?: string } | null) => void;

  // 输出面板当前激活的语言 / 视图
  activeOutputLang: string;
  setActiveOutputLang: (lang: string) => void;
  activeOutputView: OutputView;
  setActiveOutputView: (view: OutputView) => void;
}

export type OutputView = 'final' | 'model-a' | 'model-b' | 'judge' | 'source' | 'self-review';

export type InputMode = 'single' | 'batch';

const DEFAULT_SETTINGS: TranslationSettings = {
  mode: 'multi',
  sourceLanguage: 'auto',
  targetLanguages: ['en', 'ja', 'fr'],
  primaryModel: DEFAULT_MODEL,
  secondaryModel: DEFAULT_SECONDARY_MODEL,
  judgeModel: DEFAULT_JUDGE_MODEL,
  professional: 60,
  warmth: 40,
  glossaryId: 'momcozy',
  templateIds: [],
  customRequirement: '',
  styleEnabled: false,
  safetyEnabled: true,
};

const DEFAULT_INPUT: InputContent = {
  type: 'text',
  text: '',
};

export const useTranslationStore = create<TranslationStore>((set) => ({
  inputMode: 'single' as InputMode,
  setInputMode: (inputMode) => set({ inputMode }),

  input: DEFAULT_INPUT,
  setInput: (input) => set({ input }),
  setInputText: (text) =>
    set((state) => ({ input: { ...state.input, text } })),

  settings: DEFAULT_SETTINGS,
  setMode: (mode) =>
    set((state) => ({ settings: { ...state.settings, mode } })),
  setSourceLanguage: (sourceLanguage) =>
    set((state) => ({ settings: { ...state.settings, sourceLanguage } })),
  setTargetLanguages: (targetLanguages) =>
    set((state) => ({ settings: { ...state.settings, targetLanguages } })),
  toggleTargetLanguage: (lang) =>
    set((state) => {
      const current = state.settings.targetLanguages;
      const next = current.includes(lang)
        ? current.filter((l) => l !== lang)
        : [...current, lang];
      return { settings: { ...state.settings, targetLanguages: next } };
    }),
  setPrimaryModel: (primaryModel) =>
    set((state) => ({ settings: { ...state.settings, primaryModel } })),
  setSecondaryModel: (secondaryModel) =>
    set((state) => ({ settings: { ...state.settings, secondaryModel } })),
  setJudgeModel: (judgeModel) =>
    set((state) => ({ settings: { ...state.settings, judgeModel } })),
  setProfessional: (professional) =>
    set((state) => ({ settings: { ...state.settings, professional } })),
  setWarmth: (warmth) =>
    set((state) => ({ settings: { ...state.settings, warmth } })),
  setGlossaryId: (glossaryId) =>
    set((state) => ({ settings: { ...state.settings, glossaryId } })),
  setTemplateIds: (templateIds) =>
    set((state) => ({ settings: { ...state.settings, templateIds } })),
  toggleTemplateId: (id) =>
    set((state) => {
      const current = state.settings.templateIds;
      const next = current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id];
      return { settings: { ...state.settings, templateIds: next } };
    }),
  setCustomRequirement: (customRequirement) =>
    set((state) => ({ settings: { ...state.settings, customRequirement } })),
  setStyleEnabled: (styleEnabled) =>
    set((state) => ({ settings: { ...state.settings, styleEnabled } })),
  setSafetyEnabled: (safetyEnabled) =>
    set((state) => ({ settings: { ...state.settings, safetyEnabled } })),

  result: null,
  setResult: (result) => set({ result }),

  isTranslating: false,
  setIsTranslating: (isTranslating) => set({ isTranslating }),

  error: null,
  setError: (error) => set({ error }),

  progress: null,
  setProgress: (progress) => set({ progress }),

  activeOutputLang: 'en',
  setActiveOutputLang: (activeOutputLang) => set({ activeOutputLang }),
  activeOutputView: 'final',
  setActiveOutputView: (activeOutputView) => set({ activeOutputView }),
}));
