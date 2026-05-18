// ============================================================
// ROOT LINGO — 核心类型定义
// ============================================================

// --- 语言 ---
export interface Language {
  id: string;
  label: string;
  labelEn: string;
  flag: string;
  rtl: boolean;
  popular: boolean;
}

// --- 模型 ---
export type ProviderId = 'openai' | 'anthropic' | 'google' | 'deepseek' | 'qwen';

export interface Model {
  id: string;
  label: string;
  contextWindow: number;
  reasoning?: boolean;
}

export interface Provider {
  id: ProviderId;
  label: string;
  endpoint: string;
  keyFormat: string;
  docsUrl: string;
  models: Model[];
}

// 完整模型标识(用于 UI 下拉、调用路由)
export interface ModelRef {
  providerId: ProviderId;
  modelId: string;
}

// --- 翻译模式 ---
export type TranslationMode = 'quick' | 'single' | 'multi';

// --- 输入 ---
export type InputType = 'text' | 'file' | 'image' | 'srt';

export interface InputContent {
  type: InputType;
  text: string;            // 解析后的纯文本
  fileName?: string;
  fileType?: string;       // mime 或扩展名
  srtCues?: SrtCue[];      // srt 专用,保留时间戳
}

export interface SrtCue {
  index: number;
  start: string;           // "00:00:01,000"
  end: string;             // "00:00:03,500"
  text: string;
}

// --- 翻译设置 ---
export interface TranslationSettings {
  mode: TranslationMode;
  sourceLanguage: string;  // "auto" or language id
  targetLanguages: string[];

  // 模型选择
  primaryModel: ModelRef;   // Quick / Single 用这个;Multi 模式下作为模型 A
  secondaryModel?: ModelRef; // Multi 模式下的模型 B
  judgeModel?: ModelRef;     // Multi 模式下的裁判模型

  // 风格
  professional: number;     // 0-100
  warmth: number;           // 0-100

  // 术语库 & prompt 模板
  glossaryId: string;       // 'momcozy' | 'none' | custom-id
  templateId: string;       // 'default' | custom-id

  // 自定义需求
  customRequirement: string;

  // 风格启用开关(仅 Single / Multi 模式有效)
  styleEnabled: boolean;

  // 安全边界
  safetyEnabled: boolean;
}

// --- 翻译结果 ---
export interface TranslationResult {
  // 各语言的最终译文
  final: Record<string, string>;

  // 中间产物(根据模式不同)
  intermediate?: {
    // Multi 模式
    A?: Record<string, string>;
    B?: Record<string, string>;
    judgeReport?: Record<string, string>;

    // Single 模式
    initial?: Record<string, string>;
    selfReviewLog?: Record<string, string>;
  };

  meta: {
    mode: TranslationMode;
    startedAt: number;
    finishedAt: number;
    durationMs: number;
    modelsUsed: ModelRef[];
  };
}

// --- 术语库 ---
export interface GlossaryTerm {
  source: string;                            // 原文(默认英文)
  translations: Record<string, string>;      // { 'zh-CN': '...', 'fr': '...', ... }
  banned?: string[];                         // 禁用词(统一表达)
  taboo?: Record<string, string>;            // 文化禁忌词,按语言
  context?: string;
  level?: string;                            // 品牌层 / 产品层 / 营销层等
  type?: string;                             // 品牌名 / 产品名 / 卖点等
  product?: string;
  notes?: string;
  category?: string;
}

export interface Glossary {
  id: string;
  name: string;
  description?: string;
  version?: string;
  sourceLang: string;
  terms: GlossaryTerm[];
  isBuiltin?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

// --- 提示词模板 ---
export interface PromptTemplate {
  id: string;
  name: string;
  description?: string;
  content: string;
  isBuiltin?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

// --- API Keys ---
export interface ApiKeys {
  openai?: string;
  anthropic?: string;
  google?: string;
  deepseek?: string;
  qwen?: string;
}

// --- 草稿 ---
export interface LocalDraft {
  id: string;
  name: string;
  input: InputContent;
  settings: TranslationSettings;
  result?: TranslationResult;
  createdAt: number;
  updatedAt: number;
}

// --- LLM 调用接口 ---
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  model: ModelRef;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  apiKey: string;
  signal?: AbortSignal;
  onStream?: (chunk: string) => void;
}

export interface ChatResponse {
  text: string;
  tokensUsed?: number;
  finishReason?: string;
}
