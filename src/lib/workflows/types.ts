import type { TranslationSettings, TranslationResult, ChatMessage } from '@/types';

export interface WorkflowProgressEvent {
  type: 'stage-start' | 'stream' | 'stage-end' | 'error';
  stage: WorkflowStage;
  lang?: string;
  text?: string;
  error?: string;
}

export type WorkflowStage =
  | 'translate'         // quick
  | 'translate-initial' // single
  | 'self-review'       // single
  | 'optimize'          // single
  | 'translate-a'       // multi
  | 'translate-b'       // multi
  | 'judge';            // multi

export interface WorkflowContext {
  sourceText: string;
  settings: TranslationSettings;
  signal?: AbortSignal;
  onProgress?: (e: WorkflowProgressEvent) => void;
}

export interface WorkflowResult extends TranslationResult {}
