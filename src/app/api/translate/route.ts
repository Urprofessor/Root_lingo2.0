/**
 * 翻译代理 — 客户端不再直接调 LLM API,统一走这个端点
 *
 * 流程:
 *   1. 验证 Authorization header 里的 JWT
 *   2. 解析请求体里的 model id,查路由表
 *   3. 用对应的服务端 API Key 调真实 LLM
 *   4. 把流式响应转发回客户端
 */
import { verifySession, maybeRefresh } from '@/lib/server/auth';
import { pickRoute } from '@/lib/server/router';
import { callLLMStream } from '@/lib/server/llm';
import type { ChatMessage } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 分钟,够长翻译用

interface TranslateRequestBody {
  modelId: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export async function POST(request: Request) {
  // 1. 验证 token
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const payload = await verifySession(token);
  if (!payload) {
    return new Response(JSON.stringify({ error: '未登录或会话已过期' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. 解析请求
  let body: TranslateRequestBody;
  try {
    body = (await request.json()) as TranslateRequestBody;
  } catch {
    return new Response(JSON.stringify({ error: '请求格式错误' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!body.modelId || !Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response(JSON.stringify({ error: '请求参数不完整' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 3. 选路由
  const picked = pickRoute(body.modelId);
  if (!picked) {
    return new Response(
      JSON.stringify({
        error: `模型 ${body.modelId} 当前不可用 — 后端未配置对应的 API Key`,
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 4. 调真实 LLM,转发流式响应
  try {
    const response = await callLLMStream({
      route: picked.route,
      apiKey: picked.apiKey,
      messages: body.messages,
      temperature: body.temperature,
      maxTokens: body.maxTokens,
      signal: request.signal,
    });

    // 滚动续期:如果 token 用过半,把新 token 写到响应头
    const refreshed = await maybeRefresh(payload);
    if (refreshed && response.headers) {
      const newHeaders = new Headers(response.headers);
      newHeaders.set('X-Refresh-Token', refreshed);
      return new Response(response.body, {
        status: response.status,
        headers: newHeaders,
      });
    }
    return response;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: `翻译服务出错: ${msg}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
