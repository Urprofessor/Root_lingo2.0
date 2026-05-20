import { NextResponse } from 'next/server';
import { verifySession, maybeRefresh } from '@/lib/server/auth';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';

  const payload = await verifySession(token);
  if (!payload) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const refreshed = await maybeRefresh(payload);
  return NextResponse.json({
    authenticated: true,
    username: payload.sub,
    refreshedToken: refreshed,
  });
}
