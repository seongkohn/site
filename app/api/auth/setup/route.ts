import { NextResponse } from 'next/server';
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

export async function GET() {
  ensureDb();
  return NextResponse.json({ needsSetup: !hasAdminUsers() });
}

export async function POST(request: Request) {
  ensureDb();

  if (hasAdminUsers()) {
    return NextResponse.json({ error: 'Admin account already exists' }, { status: 403 });
  }

  try {
    const { username, password } = await request.json();

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
