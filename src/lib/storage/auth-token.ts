/**
 * Auth token 本地存储
 *
 * 用 localStorage 简单存,token 本身就是签过名的 JWT,
 * 浏览器关掉不会丢,符合"30 天滚动续期"的体验。
 */
const STORAGE_KEY = 'rl:auth-token';
const USERNAME_KEY = 'rl:auth-username';

export function getAuthToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEY) || '';
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(STORAGE_KEY, token);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function getAuthUsername(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(USERNAME_KEY) || '';
}

export function setAuthUsername(username: string): void {
  if (typeof window === 'undefined') return;
  if (username) {
    localStorage.setItem(USERNAME_KEY, username);
  } else {
    localStorage.removeItem(USERNAME_KEY);
  }
}

export function clearAuth(): void {
  setAuthToken('');
  setAuthUsername('');
}
