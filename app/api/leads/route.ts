import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initializeSchema } from '@/lib/schema';
import { seedDatabase } from '@/lib/seed';
import { getAdminUser } from '@/lib/auth';

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

  // Auto-delete old leads based on configured threshold
  const autoDeleteSetting = db.prepare("SELECT value FROM settings WHERE key = 'leads_auto_delete_days'").get() as { value: string } | undefined;
  const autoDeleteDays = parseInt(autoDeleteSetting?.value || '30', 10);
  if (autoDeleteDays > 0) {
    db.prepare("DELETE FROM leads WHERE created_at < datetime('now', '-' || ? || ' days')").run(autoDeleteDays);
  }

  const leads = db.prepare(`
    SELECT l.*, p.name_en as product_name_en
    FROM leads l
    LEFT JOIN products p ON l.product_id = p.id
    ORDER BY l.created_at DESC
  `).all();

  return NextResponse.json(leads);
}
