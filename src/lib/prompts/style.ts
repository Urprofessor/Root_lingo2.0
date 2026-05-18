// ============================================================
// 风格化 Prompt — 参数化
// ============================================================
//
// 这两个 prompt 模板会根据用户调节的滑块值(0-100)插入翻译指令。
//
// 用户调整滑块时,prompt 注入器会取对应区间的描述,组合成最终
// 系统提示词的一部分,塞进 translation prompt 的 system 段。
//
// ⚠️  以下两个常量等待你填入内容。
//    在你给出 prompt 之前,翻译器会跳过这部分(用空字符串)。
// ============================================================

/**
 * 专业度 Prompt 模板
 *
 * value: 0 = 通用,100 = 专业
 *
 * 实现策略建议(给你参考,具体由你的 prompt 决定):
 *   - 把 0-100 切成 5 档(0-20 / 20-40 / 40-60 / 60-80 / 80-100)
 *   - 每档对应一段描述,翻译时根据档位选择
 *
 * 例如(占位示意,实际等你给):
 *   0-20:   使用日常用语,避免行业术语
 *   20-40:  保留必要术语,语言通俗
 *   40-60:  平衡通俗与专业
 *   60-80:  使用规范术语,语言严谨
 *   80-100: 严格专业表达,精确术语
 */
export const PROFESSIONAL_PROMPT = ``;

/**
 * 温柔度 Prompt 模板
 *
 * value: 0 = 直接,100 = 温柔
 *
 * 例如(占位示意,实际等你给):
 *   0-20:   直接、简洁、就事论事
 *   20-40:  克制礼貌,但不绕弯
 *   40-60:  友好、自然
 *   60-80:  温和、有耐心,适当使用敬语
 *   80-100: 非常亲切、细致体贴,语气柔和
 */
export const WARMTH_PROMPT = ``;

// ============================================================
// 工具函数 — prompt 拼装
// ============================================================

/**
 * 根据专业度/温柔度的数值,返回风格 prompt 片段。
 *
 * 当上面两个常量为空(尚未填入)时,返回空字符串,不影响翻译。
 */
export function buildStylePrompt(professional: number, warmth: number): string {
  const parts: string[] = [];

  if (PROFESSIONAL_PROMPT) {
    parts.push(renderStyleTemplate(PROFESSIONAL_PROMPT, professional, 'professional'));
  }
  if (WARMTH_PROMPT) {
    parts.push(renderStyleTemplate(WARMTH_PROMPT, warmth, 'warmth'));
  }

  return parts.filter(Boolean).join('\n\n');
}

/**
 * 模板渲染 — 等你给出 prompt 后,我会根据你的格式调整这里的逻辑。
 *
 * 当前默认行为:把模板原样返回,并附带数值标注。
 * 你给我 prompt 后,我会改成按档位插值的逻辑。
 */
function renderStyleTemplate(template: string, value: number, key: string): string {
  // 简单变量替换占位
  return template
    .replace('{{value}}', String(value))
    .replace('{{key}}', key);
}
