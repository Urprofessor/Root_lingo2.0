/**
 * 解析 APP_PASSWORDS 环境变量
 *
 * 格式: alice:pw1,bob:pw2,jia:pw3
 *
 * - 多组之间用逗号分隔
 * - 每组用第一个冒号分隔(username:password)
 * - 用户名/密码不能含空格,密码不能含逗号
 */
export interface UserCredential {
  username: string;
  password: string;
}

export function parsePasswords(raw: string | undefined): UserCredential[] {
  if (!raw) return [];
  const entries = raw.split(',').map((s) => s.trim()).filter(Boolean);
  const out: UserCredential[] = [];
  for (const entry of entries) {
    const colonIdx = entry.indexOf(':');
    if (colonIdx <= 0) continue;
    const username = entry.slice(0, colonIdx).trim();
    const password = entry.slice(colonIdx + 1).trim();
    if (!username || !password) continue;
    out.push({ username, password });
  }
  return out;
}

/**
 * 验证用户名+密码,通过返回 username,否则 null
 */
export function verifyCredentials(
  raw: string | undefined,
  username: string,
  password: string
): string | null {
  const users = parsePasswords(raw);
  const match = users.find((u) => u.username === username && u.password === password);
  return match ? match.username : null;
}
