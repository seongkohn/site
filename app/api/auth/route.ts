import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initializeSchema } from '@/lib/schema';
import { seedDatabase } from '@/lib/seed';
import { verifyPassword, createToken, getTokenCookieOptions, getLogoutCookieOptions } from '@/lib/auth';
import { verifyTurnstile } from '@/lib/turnstile';
import { isRateLimited } from '@/lib/rate-limit';
import type { AdminUser } from '@/lib/types';

function ensureDb() {
  initializeSchema();
  seedDatabase();
}

export async function POST(request: Request) {
  try {
    ensureDb();
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (isRateLimited(`login:${ip}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many login attempts. Try again later.' }, { status: 429 });
    }

    const { username, password, turnstileToken } = await request.json();

    if (!await verifyTurnstile(turnstileToken || '', ip)) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
    }

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username) as AdminUser | undefined;
    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = createToken({ id: user.id, username: user.username });
    const response = NextResponse.json({ success: true, username: user.username });
    response.cookies.set(getTokenCookieOptions(token));
    return response;
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(getLogoutCookieOptions());
  return response;
}
