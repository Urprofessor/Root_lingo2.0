'use client';

import { create } from 'zustand';
import type { BatchFile, BatchOptions, BatchProgress } from '@/types/batch';
import { DEFAULT_BATCH_OPTIONS } from '@/types/batch';

export interface BatchStore {
  files: BatchFile[];
  addFiles: (newFiles: BatchFile[]) => void;
  updateFile: (id: string, patch: Partial<BatchFile>) => void;
  removeFile: (id: string) => void;
  clearAll: () => void;

  options: BatchOptions;
  setDelayBetweenFiles: (s: number) => void;
  setMaxRetries: (n: number) => void;

  running: boolean;
  setRunning: (b: boolean) => void;
  progress: BatchProgress | null;
  setProgress: (p: BatchProgress | null) => void;
  fatalError: string | null;
  setFatalError: (e: string | null) => void;

  resetRunState: () => void;
}

export const useBatchTranslation = create<BatchStore>((set) => ({
  files: [],
  addFiles: (newFiles) =>
    set((state) => ({ files: [...state.files, ...newFiles] })),
  updateFile: (id, patch) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    })),
  removeFile: (id) =>
    set((state) => ({ files: state.files.filter((f) => f.id !== id) })),
  clearAll: () =>
    set({
      files: [],
      progress: null,
      fatalError: null,
      running: false,
    }),

  options: DEFAULT_BATCH_OPTIONS,
  setDelayBetweenFiles: (delayBetweenFilesSec) =>
    set((state) => ({ options: { ...state.options, delayBetweenFilesSec } })),
  setMaxRetries: (maxRetries) =>
    set((state) => ({ options: { ...state.options, maxRetries } })),

  running: false,
  setRunning: (b) => set({ running: b }),
  progress: null,
  setProgress: (p) => set({ progress: p }),
  fatalError: null,
  setFatalError: (e) => set({ fatalError: e }),

  resetRunState: () =>
    set({ running: false, progress: null, fatalError: null }),
}));
