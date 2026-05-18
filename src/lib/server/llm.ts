/**
 * 服务端 LLM 调用 — 把客户端请求转发给真实 API,流式输出转发给客户端
 *
 * 三个 provider 共用一个统一接口,返回 Response(SSE)
 */
import type { ChatMessage } from '@/types';
import type { ModelRoute } from './router';

export interface ServerChatRequest {
  route: ModelRoute;
  apiKey: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

/**
 * 主入口 — 根据 route.via 路由
 * 返回 Response 对象(供 API Route 直接返回给客户端)
 */
export async function callLLMStream(req: ServerChatRequest): Promise<Response> {
  switch (req.route.via) {
    case 'anthropic':
      return callAnthropic(req);
    case 'deepseek':
      return callOpenAICompat(req, 'https://api.deepseek.com/chat/completions');
    case 'openrouter':
      return callOpenAICompat(req, 'https://openrouter.ai/api/v1/chat/completions', true);
    default:
      throw new Error(`Unsupported provider: ${req.route.via}`);
  }
}

/**
 * Anthropic 调用 — 直接转发原始 SSE,不需要协议转换
 */
async function callAnthropic(req: ServerChatRequest): Promise<Response> {
  const systemMsgs = req.messages.filter((m) => m.role === 'system');
  const otherMsgs = req.messages.filter((m) => m.role !== 'system');

  const body: Record<string, unknown> = {
    model: req.route.modelId,
    max_tokens: req.maxTokens || 4096,
    messages: otherMsgs.map((m) => ({ role: m.role, content: m.content })),
    stream: true,
  };
  if (systemMsgs.length > 0) {
    body.system = systemMsgs.map((m) => m.content).join('\n\n');
  }
  if (typeof req.temperature === 'number') {
    body.temperature = req.temperature;
  }

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': req.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
    signal: req.signal,
  });

  if (!upstream.ok) {
    const errText = await upstream.text();
    return new Response(
      JSON.stringify({ error: `Anthropic ${upstream.status}: ${errText.slice(0, 500)}` }),
      { status: upstream.status, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Anthropic 返回的就是 SSE,转协议成我们统一的 SSE 格式
  return new Response(transformAnthropicSSE(upstream.body!), {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}

/**
 * OpenAI 协议兼容 — DeepSeek / OpenRouter / 任何 OpenAI 兼容 API
 */
async function callOpenAICompat(
  req: ServerChatRequest,
  endpoint: string,
  isOpenRouter = false
): Promise<Response> {
  const body: Record<string, unknown> = {
    model: req.route.modelId,
    messages: req.messages,
    stream: true,
  };
  if (typeof req.temperature === 'number') body.temperature = req.temperature;
  if (typeof req.maxTokens === 'number') body.max_tokens = req.maxTokens;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${req.apiKey}`,
  };

  // OpenRouter 推荐附带这两个 header(用于 OpenRouter 的统计)
  if (isOpenRouter) {
    headers['HTTP-Referer'] = 'https://root-lingo.vercel.app';
    headers['X-Title'] = 'ROOT LINGO';
  }

  const upstream = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: req.signal,
  });

  if (!upstream.ok) {
    const errText = await upstream.text();
    return new Response(
      JSON.stringify({ error: `${req.route.via} ${upstream.status}: ${errText.slice(0, 500)}` }),
      { status: upstream.status, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // OpenAI 协议 SSE 转成我们的统一格式
  return new Response(transformOpenAISSE(upstream.body!), {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}

/**
 * 把 Anthropic 的 SSE 转成统一格式:
 *   data: {"delta": "..."}      ← 文本片段
 *   data: {"done": true}        ← 结束
 *   data: {"error": "..."}      ← 错误
 */
function transformAnthropicSSE(stream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';

  return new ReadableStream({
    async start(controller) {
      const reader = stream.getReader();
      try {
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
              if (json.type === 'content_block_delta') {
                const delta = json.delta?.text || '';
                if (delta) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
                }
              }
            } catch {
              // ignore
            }
          }
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });
}

function transformOpenAISSE(stream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';

  return new ReadableStream({
    async start(controller) {
      const reader = stream.getReader();
      try {
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
            if (data === '[DONE]') continue;
            if (!data) continue;
            try {
              const json = JSON.parse(data);
              const delta = json.choices?.[0]?.delta?.content || '';
              if (delta) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
              }
            } catch {
              // ignore parse errors on partial chunks
            }
          }
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });
}
