import { NextResponse } from 'next/server';
import { verifyCredentials } from '@/lib/server/parse-passwords';
import { signSession } from '@/lib/server/auth';

export const runtime = 'edge';

export async function POST(request: Request) {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 });
  }

  const { username, password } = body;
  if (!username || !password) {
    return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 });
  }

  // 验证用户名密码
  const verified = verifyCredentials(process.env.APP_PASSWORDS, username, password);
  if (!verified) {
    // 不告诉攻击者"用户存在但密码错"还是"用户不存在",统一报错
    return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
  }

  // 签发 session token
  try {
    const token = await signSession(verified);
    return NextResponse.json({
      token,
      username: verified,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `服务器配置错误: ${msg}` }, { status: 500 });
  }
}
