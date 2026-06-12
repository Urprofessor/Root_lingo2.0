// ============================================================
// 批量翻译 — 领域类型
// ============================================================
import type { InputContent } from './index';

export type BatchFileStatus =
  | 'queued'      // 已加入,等待解析
  | 'parsing'     // 解析中
  | 'parsed'      // 解析完,等待翻译
  | 'translating' // 翻译中
  | 'retrying'    // 出错后重试中
  | 'done'        // 翻译完
  | 'error'       // 解析/翻译失败
  | 'cancelled';  // 用户取消

export interface BatchFile {
  id: string;
  file: File;            // 原始 File 对象(用于结构化导出时拿原 zip)
  fileName: string;
  fileSize: number;
  fileType: string;      // 扩展名,如 docx / md / txt
  status: BatchFileStatus;

  // 解析后内容(走主翻译 store 的同一套解析器)
  input?: InputContent;
  parseError?: string;

  // 翻译结果:lang -> 译文
  results?: Record<string, string>;
  translateError?: string;
  attempts: number;      // 已尝试次数

  startedAt?: number;
  finishedAt?: number;
}

export interface BatchOptions {
  /** 文件之间的间隔秒数(0 = 不间隔) */
  delayBetweenFilesSec: number;
  /** 单文件翻译失败的最大重试次数(0 = 不重试) */
  maxRetries: number;
  /** 重试间隔的基础秒数(指数退避:base * 3^attempt) */
  retryBaseSec: number;
}

export const DEFAULT_BATCH_OPTIONS: BatchOptions = {
  delayBetweenFilesSec: 5,
  maxRetries: 3,
  retryBaseSec: 5,  // 5s → 15s → 45s
};

export interface BatchProgress {
  totalFiles: number;
  doneFiles: number;
  errorFiles: number;
  currentFileId: string | null;
  currentFileName: string;
  // 当前文件在重试时的提示
  retryHint?: string;
}

// 批量翻译支持的扩展名
export const BATCH_SUPPORTED_EXTS = ['txt', 'md', 'markdown', 'docx', 'pdf', 'pptx', 'xlsx', 'xls', 'csv'];
