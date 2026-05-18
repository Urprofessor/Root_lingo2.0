/**
 * 模型路由表
 *
 * 每个模型可以有 1-2 条路由,按数组顺序尝试:
 *   - 第一条优先(通常是官方直连)
 *   - 第二条兜底(通常是 OpenRouter)
 *
 * 后端会按这个顺序探测哪条可用(对应的环境变量 KEY 存在)
 */
export type ProviderId = 'anthropic' | 'deepseek' | 'openrouter';

export interface ModelRoute {
  via: ProviderId;
  modelId: string;
}

/**
 * 用户在 UI 看到的 model id  →  实际可用的路由列表
 */
export const MODEL_ROUTES: Record<string, ModelRoute[]> = {
  // ========== OpenAI 系列 — 全走 OpenRouter ==========
  'gpt-5.5':         [{ via: 'openrouter', modelId: 'openai/gpt-5.5' }],
  'gpt-5.4-mini':    [{ via: 'openrouter', modelId: 'openai/gpt-5.4-mini' }],
  'gpt-5.3-instant': [{ via: 'openrouter', modelId: 'openai/gpt-5.3-instant' }],
  'o3':              [{ via: 'openrouter', modelId: 'openai/o3' }],
  'o4-mini':         [{ via: 'openrouter', modelId: 'openai/o4-mini' }],

  // ========== Anthropic 系列 — 优先官方,兜底 OpenRouter ==========
  'claude-opus-4-6':   [
    { via: 'anthropic',  modelId: 'claude-opus-4-6' },
    { via: 'openrouter', modelId: 'anthropic/claude-opus-4.6' },
  ],
  'claude-sonnet-4-6': [
    { via: 'anthropic',  modelId: 'claude-sonnet-4-6' },
    { via: 'openrouter', modelId: 'anthropic/claude-sonnet-4.6' },
  ],
  'claude-haiku-4-5':  [
    { via: 'anthropic',  modelId: 'claude-haiku-4-5' },
    { via: 'openrouter', modelId: 'anthropic/claude-haiku-4.5' },
  ],

  // ========== Google 系列 — 全走 OpenRouter ==========
  'gemini-2.5-pro':   [{ via: 'openrouter', modelId: 'google/gemini-2.5-pro' }],
  'gemini-2.5-flash': [{ via: 'openrouter', modelId: 'google/gemini-2.5-flash' }],

  // ========== DeepSeek — 优先官方,兜底 OpenRouter ==========
  'deepseek-v4-pro':   [
    { via: 'deepseek',   modelId: 'deepseek-v4-pro' },
    { via: 'openrouter', modelId: 'deepseek/deepseek-v4-pro' },
  ],
  'deepseek-v4-flash': [
    { via: 'deepseek',   modelId: 'deepseek-v4-flash' },
    { via: 'openrouter', modelId: 'deepseek/deepseek-v4-flash' },
  ],

  // ========== Qwen 系列 — 全走 OpenRouter ==========
  'qwen-max':   [{ via: 'openrouter', modelId: 'qwen/qwen-max' }],
  'qwen-plus':  [{ via: 'openrouter', modelId: 'qwen/qwen-plus' }],
  'qwen-turbo': [{ via: 'openrouter', modelId: 'qwen/qwen-turbo' }],
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
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY || '';
    case 'deepseek':
      return process.env.DEEPSEEK_API_KEY || '';
    case 'openrouter':
      return process.env.OPENROUTER_API_KEY || '';
    default:
      return '';
  }
}
