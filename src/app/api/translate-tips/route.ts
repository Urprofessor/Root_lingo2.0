/**
 * Tips 本地化代理 — 单条处理
 *
 * 前端循环调用,每次只处理一条 tip,后端在一次调用里生成 14 语言 CSV。
 * 这样每个请求都很短,不会触发 Vercel 函数超时。
 */
import { verifySession } from '@/lib/server/auth';
import { pickRoute } from '@/lib/server/router';
import { callLLMText } from '@/lib/server/llm-text';
import { buildTipsPrompt } from '@/lib/tips/prompt';
import { cleanTipsOutput } from '@/lib/tips/csv';

export const runtime = 'nodejs';

interface TipsRequestBody {
  modelId: string;
  tipCode: string;
  content: string;
}

export async function POST(request: Request) {
  // 验证 token
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const payload = await verifySession(token);
  if (!payload) {
    return json({ error: '未登录或会话已过期' }, 401);
  }

  let body: TipsRequestBody;
  try {
    body = (await request.json()) as TipsRequestBody;
  } catch {
    return json({ error: '请求格式错误' }, 400);
  }

  if (!body.modelId || !body.tipCode || !body.content) {
    return json({ error: '缺少 modelId / tipCode / content' }, 400);
  }

  const picked = pickRoute(body.modelId);
  if (!picked) {
    return json({ error: `模型 ${body.modelId} 不可用 — 后端未配置对应 API Key` }, 503);
  }

  const prompt = buildTipsPrompt(body.tipCode, body.content);

  const result = await callLLMText({
    route: picked.route,
    apiKey: picked.apiKey,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    maxTokens: 4096,
    signal: request.signal,
  });

  if (!result.ok) {
    return json({ error: result.error || '生成失败' }, result.status || 500);
  }

  const csv = cleanTipsOutput(result.text || '');
  return json({ csv, tipCode: body.tipCode });
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
