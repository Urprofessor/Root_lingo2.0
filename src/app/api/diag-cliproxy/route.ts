/**
 * 临时诊断接口 — 测试 Vercel 服务器到 cliproxy.luteos.site 网关的连通性
 *
 * 使用：部署后访问 https://<你的域名>/api/diag-cliproxy
 *
 * 不返回 API Key，只返回连接信息、HTTP 状态码、耗时、错误类型。
 * 诊断完毕请删除本文件。
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const TARGET = 'https://cliproxy.luteos.site/v1/chat/completions';
const PROBE_MODEL = 'claude-haiku-4.5';
const PROBE_TIMEOUT_MS = 30_000;

interface StageResult {
  stage: string;
  ok: boolean;
  ms: number;
  detail: Record<string, unknown>;
}

async function probeReachability(): Promise<StageResult> {
  const t0 = Date.now();
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), PROBE_TIMEOUT_MS);
  try {
    // 用一个明知无效的 key 打一次真实请求，只要能拿到 401/4xx 就说明网络通
    const res = await fetch(TARGET, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer probe-no-key',
      },
      body: JSON.stringify({
        model: PROBE_MODEL,
        messages: [{ role: 'user', content: 'ping' }],
      }),
      signal: ac.signal,
    });
    const text = await res.text().catch(() => '');
    return {
      stage: 'reachability',
      ok: true,
      ms: Date.now() - t0,
      detail: {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        bodyPreview: text.slice(0, 300),
      },
    };
  } catch (e) {
    const err = e as Error & { cause?: { code?: string; errno?: string } };
    return {
      stage: 'reachability',
      ok: false,
      ms: Date.now() - t0,
      detail: {
        errorName: err.name,
        errorMessage: err.message,
        errorCode: err.cause?.code || err.cause?.errno || null,
        aborted: err.name === 'AbortError',
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

async function probeRealCall(apiKey: string): Promise<StageResult> {
  const t0 = Date.now();
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(TARGET, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: PROBE_MODEL,
        messages: [{ role: 'user', content: 'Reply with the single word: pong' }],
      }),
      signal: ac.signal,
    });
    const body = await res.text().catch(() => '');
    let parsedContent: string | null = null;
    try {
      const j = JSON.parse(body) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      parsedContent = j.choices?.[0]?.message?.content ?? null;
    } catch {
      /* ignore */
    }
    return {
      stage: 'real-call',
      ok: res.ok,
      ms: Date.now() - t0,
      detail: {
        httpStatus: res.status,
        httpStatusText: res.statusText,
        modelReply: parsedContent,
        bodyPreview: parsedContent ? null : body.slice(0, 300),
      },
    };
  } catch (e) {
    const err = e as Error & { cause?: { code?: string; errno?: string } };
    return {
      stage: 'real-call',
      ok: false,
      ms: Date.now() - t0,
      detail: {
        errorName: err.name,
        errorMessage: err.message,
        errorCode: err.cause?.code || err.cause?.errno || null,
        aborted: err.name === 'AbortError',
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  const startedAt = new Date().toISOString();
  const env = {
    vercelRegion: process.env.VERCEL_REGION || null,
    vercelEnv: process.env.VERCEL_ENV || null,
    nodeVersion: process.version,
    hasCompatibleKey: Boolean(process.env.COMPATIBLE_API_KEY),
  };

  const reachability = await probeReachability();

  let realCall: StageResult | { skipped: true; reason: string } = {
    skipped: true,
    reason: 'COMPATIBLE_API_KEY not set; only reachability tested',
  };

  if (process.env.COMPATIBLE_API_KEY && reachability.ok) {
    realCall = await probeRealCall(process.env.COMPATIBLE_API_KEY);
  } else if (process.env.COMPATIBLE_API_KEY && !reachability.ok) {
    realCall = {
      skipped: true,
      reason: 'reachability failed; skipped real call',
    };
  }

  const verdict =
    reachability.ok && (('skipped' in realCall) || realCall.ok)
      ? 'PASS — Vercel 可以访问 cliproxy 网关'
      : !reachability.ok
        ? 'FAIL — Vercel 无法连接 cliproxy 网关（看 reachability.detail 里的错误）'
        : 'FAIL — 网络通但真实调用失败（看 real-call.detail）';

  return new Response(
    JSON.stringify(
      {
        startedAt,
        target: TARGET,
        env,
        reachability,
        realCall,
        verdict,
      },
      null,
      2,
    ),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    },
  );
}
