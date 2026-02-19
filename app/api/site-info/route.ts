import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initializeSchema } from '@/lib/schema';
import { seedDatabase } from '@/lib/seed';

const PUBLIC_KEYS = [
  'company_name_en',
  'company_name_ko',
  'company_address_en',
  'company_address_ko',
  'company_phone',
  'company_fax',
  'company_email',
];

export async function GET() {
  try {
    initializeSchema();
    seedDatabase();
    const db = getDb();
    const rows = db
      .prepare(`SELECT key, value FROM settings WHERE key IN (${PUBLIC_KEYS.map(() => '?').join(',')})`)
      .all(...PUBLIC_KEYS) as { key: string; value: string }[];

    const info: Record<string, string> = {};
    for (const row of rows) {
      info[row.key] = row.value;
    }
    return NextResponse.json(info);
  } catch {
    return NextResponse.json({});
  }
}
