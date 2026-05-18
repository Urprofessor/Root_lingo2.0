/**
 * 前端 LLM 调用 — 统一走本站 /api/translate 代理
 *
 * 不再直接调各家 LLM API。Key 完全藏在服务器。
 */
import type { ChatMessage, ModelRef } from '@/types';
import { getAuthToken, setAuthToken } from '@/lib/storage/auth-token';

export class LLMError extends Error {
  constructor(message: string, public readonly statusCode?: number) {
    super(message);
    this.name = 'LLMError';
  }
}

export interface ChatRequest {
  model: ModelRef;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  onStream?: (chunk: string) => void;
}

export interface ChatResponse {
  text: string;
}

/**
 * 调用本站翻译代理,返回流式响应
 */
export async function chat(req: ChatRequest): Promise<ChatResponse> {
  const token = getAuthToken();
  if (!token) {
    throw new LLMError('未登录,请先登录', 401);
  }

  const res = await fetch('/api/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      modelId: req.model.modelId,
      messages: req.messages,
      temperature: req.temperature,
      maxTokens: req.maxTokens,
    }),
    signal: req.signal,
  });

  if (!res.ok) {
    const errText = await res.text();
    let errMsg = errText;
    try {
      const parsed = JSON.parse(errText);
      if (parsed.error) errMsg = parsed.error;
    } catch {
      // ignore
    }
    if (res.status === 401) {
      // token 失效,清掉
      setAuthToken('');
      throw new LLMError('登录已失效,请重新登录', 401);
    }
    throw new LLMError(errMsg, res.status);
  }

  // 检查滚动续期
  const refreshed = res.headers.get('x-refresh-token');
  if (refreshed) setAuthToken(refreshed);

  // 读 SSE 流
  const reader = res.body?.getReader();
  if (!reader) throw new LLMError('无响应内容');

  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (!data) continue;
      try {
        const json = JSON.parse(data);
        if (json.error) throw new LLMError(json.error);
        if (json.done) continue;
        if (json.delta) {
          fullText += json.delta;
          req.onStream?.(json.delta);
        }
      } catch (e) {
        if (e instanceof LLMError) throw e;
        // ignore JSON parse errors on partial chunks
      }
    }
  }

  return { text: fullText };
}
