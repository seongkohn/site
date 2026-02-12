import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initializeSchema } from '@/lib/schema';
import { seedDatabase } from '@/lib/seed';
import { getAdminUser } from '@/lib/auth';

function ensureDb() {
  initializeSchema();
  seedDatabase();
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  ensureDb();
  const db = getDb();
  const { id } = await params;
  const body = await request.json();

  if (body.is_read !== undefined) {
    db.prepare('UPDATE leads SET is_read = ? WHERE id = ?').run(body.is_read ? 1 : 0, parseInt(id, 10));
  }

  const updated = db.prepare('SELECT * FROM leads WHERE id = ?').get(parseInt(id, 10));
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  ensureDb();
  const db = getDb();
  const { id } = await params;

  db.prepare('DELETE FROM leads WHERE id = ?').run(parseInt(id, 10));
  return NextResponse.json({ success: true });
}
