/**
 * Session 签发与验证
 *
 * 用 JWT(HS256)做无状态 session,signed with SESSION_SECRET。
 * - 30 天有效期(可通过 SESSION_TTL_DAYS 调)
 * - 滚动续期:验证通过后,如果 token 已用过半生命周期,签一个新 token 返回给客户端
 */
import { SignJWT, jwtVerify } from 'jose';

const DEFAULT_TTL_DAYS = 30;

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(secret);
}

function getTtlSeconds(): number {
  const raw = process.env.SESSION_TTL_DAYS;
  const days = raw ? Number(raw) : DEFAULT_TTL_DAYS;
  return (Number.isFinite(days) ? days : DEFAULT_TTL_DAYS) * 24 * 60 * 60;
}

export interface SessionPayload {
  sub: string;          // username
  iat: number;          // issued at (epoch seconds)
  exp: number;          // expiration (epoch seconds)
}

export async function signSession(username: string): Promise<string> {
  const ttlSec = getTtlSeconds();
  const iat = Math.floor(Date.now() / 1000);
  return await new SignJWT({ sub: username })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(username)
    .setIssuedAt(iat)
    .setExpirationTime(iat + ttlSec)
    .sign(getSecretKey());
}

export async function verifySession(token: string | null | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ['HS256'] });
    if (!payload.sub || typeof payload.iat !== 'number' || typeof payload.exp !== 'number') {
      return null;
    }
    return { sub: payload.sub, iat: payload.iat, exp: payload.exp };
  } catch {
    return null;
  }
}

/**
 * 如果 token 已用过半生命周期,签发一个新的;否则返回 null(无需续期)
 */
export async function maybeRefresh(
  payload: SessionPayload
): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);
  const half = payload.iat + Math.floor((payload.exp - payload.iat) / 2);
  if (now > half) {
    return await signSession(payload.sub);
  }
  return null;
}
