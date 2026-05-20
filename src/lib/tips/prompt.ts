/**
 * Tips 本地化模式 — prompt 与目标语言定义
 */

/** 固定的 14 个目标 locale,顺序与 prompt 一致 */
export const TIPS_LOCALES: { code: string; label: string }[] = [
  { code: 'de-DE', label: 'German (Germany)' },
  { code: 'fr-FR', label: 'French (France)' },
  { code: 'it-IT', label: 'Italian (Italy)' },
  { code: 'es-ES', label: 'Spanish (Spain)' },
  { code: 'ar', label: 'Arabic (Saudi Arabia)' },
  { code: 'id-ID', label: 'Indonesian (Indonesia)' },
  { code: 'th-TH', label: 'Thai (Thailand)' },
  { code: 'ms-MY', label: 'Malay (Malaysia)' },
  { code: 'vi-VN', label: 'Vietnamese (Vietnam)' },
  { code: 'ru-RU', label: 'Russian (Russia)' },
  { code: 'ja-JP', label: 'Japanese (Japan)' },
  { code: 'zh-TW', label: 'Traditional Chinese (Taiwan)' },
  { code: 'pt-PT', label: 'Portuguese (Portugal)' },
  { code: 'fil-PH', label: 'Filipino (Philippines)' },
];

/**
 * 构建单条 tip 的本地化 prompt
 */
export function buildTipsPrompt(tipCode: string, content: string): string {
  return `You are a senior localization editor for a premium parenting and baby development app.
Your task is to localize baby milestone tips into multiple languages while preserving emotional warmth, natural fluency, and mobile-friendly readability.

Requirements:
- Preserve the original tip_code
- Generate one row per locale
- Return plain raw CSV only
- Do NOT use markdown
- Do NOT add explanations
- Do NOT translate literally
- Sound like a real parenting app notification written by a native editor
- Warm, caring, supportive tone
- Avoid robotic, clinical, or machine-like wording
- Keep sentences concise and natural for mobile reading
- Preserve emotional encouragement and parenting warmth
- Adapt naturally to local parenting culture and tone
- No emojis
- UTF-8 compatible

Brand voice:
- warm
- premium
- reassuring
- emotionally intelligent

Target locales:
de-DE = German (Germany)
fr-FR = French (France)
it-IT = Italian (Italy)
es-ES = Spanish (Spain)
ar = Arabic (Saudi Arabia)
id-ID = Indonesian (Indonesia)
th-TH = Thai (Thailand)
ms-MY = Malay (Malaysia)
vi-VN = Vietnamese (Vietnam)
ru-RU = Russian (Russia)
ja-JP = Japanese (Japan)
zh-TW = Traditional Chinese (Taiwan)
pt-PT = Portuguese (Portugal)
fil-PH = Filipino (Philippines)

Strict formatting rules:
- Output valid CSV only
- No code fences
- No extra empty lines
- One row per locale
- Preserve tip_code exactly
- Escape commas properly when needed
- Wrap the content field in double quotes; leave tip_code and lang_code without quotes

Output format:
tip_code,lang_code,content

Input:
tip_code: "${tipCode}"
content: "${content}"`;
}
