/**
 * 服务端非流式 LLM 调用 — 一次性返回完整文本
 *
 * 用于 Tips 本地化:需要拿到完整 CSV 后清洗,不需要流式。
 */
import type { ChatMessage } from '@/types';
import type { ModelRoute } from './router';

export interface TextChatRequest {
  route: ModelRoute;
  apiKey: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface TextChatResult {
  ok: boolean;
  text?: string;
  error?: string;
  status?: number;
}

export async function callLLMText(req: TextChatRequest): Promise<TextChatResult> {
  switch (req.route.via) {
    case 'anthropic':
      return callAnthropicText(req);
    case 'openrouter':
      return callOpenAICompatText(
        req,
        'https://openrouter.ai/api/v1/chat/completions',
        true
      );
    case 'deepseek':
      return callOpenAICompatText(req, 'https://api.deepseek.com/chat/completions');
    case 'compatible':
      return callOpenAICompatText(req, 'https://cliproxy.luteos.site/v1/chat/completions');
    default:
      return { ok: false, error: `Unsupported provider: ${req.route.via}` };
  }
}

async function callAnthropicText(req: TextChatRequest): Promise<TextChatResult> {
  const systemMsgs = req.messages.filter((m) => m.role === 'system');
  const otherMsgs = req.messages.filter((m) => m.role !== 'system');

  const body: Record<string, unknown> = {
    model: req.route.modelId,
    max_tokens: req.maxTokens || 4096,
    messages: otherMsgs.map((m) => ({ role: m.role, content: m.content })),
    stream: false,
  };
  if (systemMsgs.length > 0) body.system = systemMsgs.map((m) => m.content).join('\n\n');
  if (typeof req.temperature === 'number') body.temperature = req.temperature;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': req.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
      signal: req.signal,
    });
    if (!res.ok) {
      const errText = await res.text();
      return { ok: false, status: res.status, error: `anthropic ${res.status}: ${errText.slice(0, 500)}` };
    }
    const json = await res.json();
    const text = (json.content || []).map((c: { text?: string }) => c.text || '').join('');
    return { ok: true, text };
  } catch (e) {
    return { ok: false, error: `anthropic 连接失败: ${e instanceof Error ? e.message : String(e)}` };
  }
}

async function callOpenAICompatText(
  req: TextChatRequest,
  endpoint: string,
  isOpenRouter = false
): Promise<TextChatResult> {
  const body: Record<string, unknown> = {
    model: req.route.modelId,
    messages: req.messages,
    stream: false,
  };
  if (typeof req.temperature === 'number') body.temperature = req.temperature;
  if (typeof req.maxTokens === 'number') body.max_tokens = req.maxTokens;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${req.apiKey}`,
    Accept: 'application/json',
  };
  if (isOpenRouter) {
    headers['HTTP-Referer'] = 'https://root-lingo.vercel.app';
    headers['X-Title'] = 'ROOT LINGO';
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: req.signal,
    });
    if (!res.ok) {
      const errText = await res.text();
      return { ok: false, status: res.status, error: `${req.route.via} ${res.status}: ${errText.slice(0, 500)}` };
    }
    const json = await res.json();
    const text = json.choices?.[0]?.message?.content || '';
    return { ok: true, text };
  } catch (e) {
    return { ok: false, error: `${req.route.via} 连接失败: ${e instanceof Error ? e.message : String(e)}` };
  }
}
