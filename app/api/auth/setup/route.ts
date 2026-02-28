import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDb } from '@/lib/db';
import { initializeSchema } from '@/lib/schema';
import { seedDatabase } from '@/lib/seed';
import { hashPassword, createToken, getTokenCookieOptions } from '@/lib/auth';

function ensureDb() {
  initializeSchema();
  seedDatabase();
}

function hasAdminUsers(): boolean {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM admin_users').get() as { count: number };
  return row.count > 0;
}

function secureTokenEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export async function GET() {
  ensureDb();
  const needsSetup = !hasAdminUsers();
  const setupTokenRequired = process.env.NODE_ENV === 'production' && needsSetup;
  return NextResponse.json({
    needsSetup,
    setupTokenRequired,
    setupTokenConfigured: setupTokenRequired ? Boolean(process.env.ADMIN_SETUP_TOKEN) : true,
  });
}

export async function POST(request: Request) {
  ensureDb();

  if (hasAdminUsers()) {
    return NextResponse.json({ error: 'Admin account already exists' }, { status: 403 });
  }

  try {
    const body = await request.json() as { username?: string; password?: string; setupToken?: string };
    const username = body.username || '';
    const password = body.password || '';
    const providedSetupToken = request.headers.get('x-setup-token') || body.setupToken || '';

    if (process.env.NODE_ENV === 'production') {
      const configuredSetupToken = process.env.ADMIN_SETUP_TOKEN || '';
      if (!configuredSetupToken) {
        return NextResponse.json(
          { error: 'Admin setup is disabled until ADMIN_SETUP_TOKEN is configured on the server' },
          { status: 503 }
        );
      }
      if (!secureTokenEqual(providedSetupToken, configuredSetupToken)) {
        return NextResponse.json({ error: 'Invalid setup token' }, { status: 403 });
      }
    }

    if (!username || username.length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 });
    }

    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const db = getDb();
    const hash = hashPassword(password);
    const result = db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run(username, hash);

    const token = createToken({ id: Number(result.lastInsertRowid), username });
    const response = NextResponse.json({ success: true, username });
    response.cookies.set(getTokenCookieOptions(token));
    return response;
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
