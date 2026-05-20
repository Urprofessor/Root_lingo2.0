/**
 * 模型路由表
 *
 * 策略:部门统一网关(compatible)优先,各家官方直连兜底。
 *
 * 网关 = OpenAI 兼容接口,一个 Key 调所有模型
 *   base_url: https://cliproxy.luteos.site/v1
 *   env: COMPATIBLE_API_KEY
 *
 * 每个模型按数组顺序探测哪条可用(对应环境变量 KEY 存在)
 */
export type ProviderId = 'compatible' | 'anthropic' | 'deepseek' | 'openrouter';

export interface ModelRoute {
  via: ProviderId;
  modelId: string;
}

/**
 * 用户在 UI 看到的 model id  →  实际可用的路由列表(按优先级)
 *
 * compatible 路由用的 modelId 与网关文档里的命名一致(claude-sonnet-4.6 等)
 */
export const MODEL_ROUTES: Record<string, ModelRoute[]> = {
  // ========== Anthropic Claude ==========
  'claude-opus-4.7': [
    { via: 'compatible', modelId: 'claude-opus-4.7' },
    // 4.7 官方 / OpenRouter 兜底(命名可能不同,失败则只靠网关)
    { via: 'anthropic',  modelId: 'claude-opus-4-7' },
  ],
  'claude-opus-4.6': [
    { via: 'compatible', modelId: 'claude-opus-4.6' },
    { via: 'anthropic',  modelId: 'claude-opus-4-6' },
    { via: 'openrouter', modelId: 'anthropic/claude-opus-4.6' },
  ],
  'claude-sonnet-4.6': [
    { via: 'compatible', modelId: 'claude-sonnet-4.6' },
    { via: 'anthropic',  modelId: 'claude-sonnet-4-6' },
    { via: 'openrouter', modelId: 'anthropic/claude-sonnet-4.6' },
  ],
  'claude-haiku-4.5': [
    { via: 'compatible', modelId: 'claude-haiku-4.5' },
    { via: 'anthropic',  modelId: 'claude-haiku-4-5' },
    { via: 'openrouter', modelId: 'anthropic/claude-haiku-4.5' },
  ],

  // ========== OpenAI GPT ==========
  'gpt-5.5': [
    { via: 'compatible', modelId: 'gpt-5.5' },
    { via: 'openrouter', modelId: 'openai/gpt-5.5' },
  ],
  'gpt-5.4': [
    { via: 'compatible', modelId: 'gpt-5.4' },
    { via: 'openrouter', modelId: 'openai/gpt-5.4' },
  ],
  'gpt-5.4-mini': [
    { via: 'compatible', modelId: 'gpt-5.4-mini' },
    { via: 'openrouter', modelId: 'openai/gpt-5.4-mini' },
  ],
  'gpt-5-nano': [
    { via: 'compatible', modelId: 'gpt-5-nano' },
    { via: 'openrouter', modelId: 'openai/gpt-5-nano' },
  ],

  // ========== Google Gemini ==========
  'gemini-3.1-pro-preview': [
    { via: 'compatible', modelId: 'gemini-3.1-pro-preview' },
    { via: 'openrouter', modelId: 'google/gemini-3.1-pro-preview' },
  ],
  'gemini-3-flash-preview': [
    { via: 'compatible', modelId: 'gemini-3-flash-preview' },
    { via: 'openrouter', modelId: 'google/gemini-3-flash-preview' },
  ],

  // ========== DeepSeek ==========
  'deepseek-v4-pro': [
    { via: 'compatible', modelId: 'deepseek-v4-pro' },
    { via: 'deepseek',   modelId: 'deepseek-v4-pro' },
    { via: 'openrouter', modelId: 'deepseek/deepseek-v4-pro' },
  ],
  'deepseek-v4-flash': [
    { via: 'compatible', modelId: 'deepseek-v4-flash' },
    { via: 'deepseek',   modelId: 'deepseek-v4-flash' },
    { via: 'openrouter', modelId: 'deepseek/deepseek-v4-flash' },
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
    case 'compatible':
      return process.env.COMPATIBLE_API_KEY || '';
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
