/**
 * 模型路由表
 *
 * 策略:OpenRouter 优先(Vercel 美国服务器公网可达)。
 *
 * 说明:部门网关 cliproxy.luteos.site 有地域/网络访问限制,
 * Vercel 美国服务器无法连接(超时),因此不再作为主路由。
 * 全部模型通过 OpenRouter 统一调用,一个 Key 覆盖所有厂商。
 *
 * 如果将来在能访问网关的环境部署,可把 compatible 路由加回数组首位。
 */
import type { ProviderId } from '@/types';

export interface ModelRoute {
  via: ProviderId;
  modelId: string;
}

/**
 * 用户在 UI 看到的 model id  →  实际可用的路由列表(按优先级)
 *
 * OpenRouter 的 model slug 命名规则:厂商/模型名
 */
export const MODEL_ROUTES: Record<string, ModelRoute[]> = {
  // ========== Anthropic Claude — OpenRouter 优先,官方兜底 ==========
  'claude-opus-4.7': [
    { via: 'openrouter', modelId: 'anthropic/claude-opus-4.7' },
    { via: 'anthropic',  modelId: 'claude-opus-4-7' },
  ],
  'claude-opus-4.6': [
    { via: 'openrouter', modelId: 'anthropic/claude-opus-4.6' },
    { via: 'anthropic',  modelId: 'claude-opus-4-6' },
  ],
  'claude-sonnet-4.6': [
    { via: 'openrouter', modelId: 'anthropic/claude-sonnet-4.6' },
    { via: 'anthropic',  modelId: 'claude-sonnet-4-6' },
  ],
  'claude-haiku-4.5': [
    { via: 'openrouter', modelId: 'anthropic/claude-haiku-4.5' },
    { via: 'anthropic',  modelId: 'claude-haiku-4-5' },
  ],

  // ========== OpenAI GPT — OpenRouter ==========
  'gpt-5.5':      [{ via: 'openrouter', modelId: 'openai/gpt-5.5' }],
  'gpt-5.4':      [{ via: 'openrouter', modelId: 'openai/gpt-5.4' }],
  'gpt-5.4-mini': [{ via: 'openrouter', modelId: 'openai/gpt-5.4-mini' }],
  'gpt-5-nano':   [{ via: 'openrouter', modelId: 'openai/gpt-5-nano' }],

  // ========== Google Gemini — OpenRouter ==========
  'gemini-3.1-pro-preview': [{ via: 'openrouter', modelId: 'google/gemini-3.1-pro-preview' }],
  'gemini-3-flash-preview': [{ via: 'openrouter', modelId: 'google/gemini-3-flash-preview' }],

  // ========== DeepSeek — OpenRouter 优先,官方兜底 ==========
  'deepseek-v4-pro': [
    { via: 'openrouter', modelId: 'deepseek/deepseek-v4-pro' },
    { via: 'deepseek',   modelId: 'deepseek-v4-pro' },
  ],
  'deepseek-v4-flash': [
    { via: 'openrouter', modelId: 'deepseek/deepseek-v4-flash' },
    { via: 'deepseek',   modelId: 'deepseek-v4-flash' },
  ],
};

/**
 * 选择第一条可用路由 — 对应环境变量的 API Key 存在即可用
 */
export function pickRoute(modelId: string): { route: ModelRoute; apiKey: string } | null {
  const routes = MODEL_ROUTES[modelId];
  if (!routes || routes.length === 0) return null;

  for (const route of routes) {
    const apiKey = getApiKeyForProvider(route.via);
    if (apiKey) return { route, apiKey };
  }
  return null;
}

function getApiKeyForProvider(via: ProviderId): string {
  switch (via) {
    case 'openrouter':
      return process.env.OPENROUTER_API_KEY || '';
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY || '';
    case 'deepseek':
      return process.env.DEEPSEEK_API_KEY || '';
    case 'compatible':
      return process.env.COMPATIBLE_API_KEY || '';
    default:
      return '';
  }
}
