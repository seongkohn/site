import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initializeSchema } from '@/lib/schema';
import { seedDatabase } from '@/lib/seed';
import { getAdminUser } from '@/lib/auth';

export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  initializeSchema();
  seedDatabase();
  const db = getDb();

  const totalProducts = (db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number }).count;
  const publishedProducts = (db.prepare('SELECT COUNT(*) as count FROM products WHERE is_published = 1').get() as { count: number }).count;
  const totalLeads = (db.prepare('SELECT COUNT(*) as count FROM leads').get() as { count: number }).count;
  const unreadLeads = (db.prepare('SELECT COUNT(*) as count FROM leads WHERE is_read = 0').get() as { count: number }).count;

  return NextResponse.json({
    totalProducts,
    publishedProducts,
    totalLeads,
    unreadLeads,
  });
}
