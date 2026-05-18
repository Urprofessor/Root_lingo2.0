'use client';

import { create } from 'zustand';
import {
  getAuthToken,
  setAuthToken,
  getAuthUsername,
  setAuthUsername,
  clearAuth,
} from '@/lib/storage/auth-token';

type AuthStatus = 'idle' | 'checking' | 'authenticated' | 'unauthenticated';

interface AuthStore {
  status: AuthStatus;
  username: string;
  error: string | null;

  /** 启动时检查 token 是否仍然有效 */
  checkSession: () => Promise<void>;

  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  status: 'idle',
  username: '',
  error: null,

  async checkSession() {
    const token = getAuthToken();
    if (!token) {
      set({ status: 'unauthenticated' });
      return;
    }

    set({ status: 'checking' });
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        clearAuth();
        set({ status: 'unauthenticated', username: '' });
        return;
      }
      const data = await res.json();
      if (data.authenticated) {
        if (data.refreshedToken) setAuthToken(data.refreshedToken);
        setAuthUsername(data.username);
        set({ status: 'authenticated', username: data.username, error: null });
      } else {
        clearAuth();
        set({ status: 'unauthenticated', username: '' });
      }
    } catch {
      // 网络问题,先不踢出用户,假装仍然登录(本地有 token 就先放行)
      const localUsername = getAuthUsername();
      if (localUsername) {
        set({ status: 'authenticated', username: localUsername });
      } else {
        set({ status: 'unauthenticated' });
      }
    }
  },

  async login(username, password) {
    set({ status: 'checking', error: null });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        set({ status: 'unauthenticated', error: data.error || '登录失败' });
        return false;
      }
      setAuthToken(data.token);
      setAuthUsername(data.username);
      set({ status: 'authenticated', username: data.username, error: null });
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      set({ status: 'unauthenticated', error: `网络错误: ${msg}` });
      return false;
    }
  },

  async logout() {
    clearAuth();
    set({ status: 'unauthenticated', username: '', error: null });
    // 礼貌地通知服务端(可选,JWT 是无状态的所以不通知也行)
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
  },
}));
