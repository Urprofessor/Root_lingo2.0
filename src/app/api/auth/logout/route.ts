import { NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * 登出是客户端动作(删本地 token),服务端不持有 session 状态,
 * 这个端点纯粹给客户端一个统一的 RPC 入口。
 */
export async function POST() {
  return NextResponse.json({ ok: true });
}
