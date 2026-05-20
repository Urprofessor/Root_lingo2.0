'use client';

import { useState, useRef, useCallback } from 'react';
import { getAuthToken } from '@/lib/storage/auth-token';
import { parseTipsInput, TIPS_CSV_HEADER, type TipInput } from '@/lib/tips/csv';

export interface TipsProgress {
  total: number;
  done: number;
  currentTipCode: string | null;
}

export interface TipsRowResult {
  tipCode: string;
  csv: string;       // 这一条的 14 行 CSV
  error?: string;
}

interface UseTipsResult {
  running: boolean;
  progress: TipsProgress | null;
  results: TipsRowResult[];
  combinedCsv: string;
  error: string | null;
  start: (modelId: string, rawInput: string) => Promise<void>;
  cancel: () => void;
  reset: () => void;
}

export function useTipsLocalization(): UseTipsResult {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<TipsProgress | null>(null);
  const [results, setResults] = useState<TipsRowResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef(false);

  const start = useCallback(async (modelId: string, rawInput: string) => {
    setError(null);
    setResults([]);
    cancelRef.current = false;

    const token = getAuthToken();
    if (!token) {
      setError('未登录,请刷新页面重新登录');
      return;
    }

    const tips: TipInput[] = parseTipsInput(rawInput);
    if (tips.length === 0) {
      setError('没有解析到有效的 tip。请检查输入格式:tip_code,lang_code,"content"');
      return;
    }

    setRunning(true);
    setProgress({ total: tips.length, done: 0, currentTipCode: null });

    const collected: TipsRowResult[] = [];

    for (let i = 0; i < tips.length; i++) {
      if (cancelRef.current) break;
      const tip = tips[i];
      setProgress({ total: tips.length, done: i, currentTipCode: tip.tipCode });

      try {
        const res = await fetch('/api/translate-tips', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            modelId,
            tipCode: tip.tipCode,
            content: tip.content,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          collected.push({ tipCode: tip.tipCode, csv: '', error: data.error || `HTTP ${res.status}` });
        } else {
          collected.push({ tipCode: tip.tipCode, csv: data.csv || '' });
        }
      } catch (e) {
        collected.push({
          tipCode: tip.tipCode,
          csv: '',
          error: e instanceof Error ? e.message : String(e),
        });
      }

      setResults([...collected]);
    }

    setProgress({ total: tips.length, done: collected.length, currentTipCode: null });
    setRunning(false);
  }, []);

  const cancel = useCallback(() => {
    cancelRef.current = true;
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    setResults([]);
    setProgress(null);
    setError(null);
  }, []);

  // 合并所有成功的 CSV,加表头
  const combinedCsv = [
    TIPS_CSV_HEADER,
    ...results.filter((r) => r.csv && !r.error).map((r) => r.csv),
  ].join('\n');

  return { running, progress, results, combinedCsv, error, start, cancel, reset };
}
