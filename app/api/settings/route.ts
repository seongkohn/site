import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initializeSchema } from '@/lib/schema';
import { seedDatabase } from '@/lib/seed';
import { getAdminUser, hashPassword, verifyPassword } from '@/lib/auth';

function ensureDb() {
  initializeSchema();
  seedDatabase();
}

export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  ensureDb();
  const db = getDb();

  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }

  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  ensureDb();
  const db = getDb();
  const body = await request.json();

  // Handle password change
  if (body.password_change) {
    const { current_password, new_password } = body.password_change;
    if (!current_password || !new_password) {
      return NextResponse.json({ error: 'Current and new passwords are required' }, { status: 400 });
    }

    const adminUser = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(user.id) as { id: number; password_hash: string } | undefined;
    if (!adminUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!verifyPassword(current_password, adminUser.password_hash)) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    if (!new_password || new_password.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
    }

    const newHash = hashPassword(new_password);
    db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(newHash, user.id);

    return NextResponse.json({ success: true, message: 'Password updated' });
  }

  // Handle settings update
  if (body.settings && typeof body.settings === 'object') {
    const upsert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?');
    for (const [key, value] of Object.entries(body.settings)) {
      upsert.run(key, value as string, value as string);
    }
  }

  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }

  return NextResponse.json(settings);
}
