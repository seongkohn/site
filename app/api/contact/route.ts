import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initializeSchema } from '@/lib/schema';
import { seedDatabase } from '@/lib/seed';
import { sendContactEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    initializeSchema();
    seedDatabase();

    const body = await request.json();
    const { name, email, phone, company, message, product_id } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Save to leads table
    db.prepare(`
      INSERT INTO leads (name, email, phone, company, message, product_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, email, phone || null, company || null, message, product_id || null);

    // Get product name if product_id provided
    let productName: string | undefined;
    if (product_id) {
      const product = db.prepare('SELECT name_en FROM products WHERE id = ?').get(product_id) as { name_en: string } | undefined;
      productName = product?.name_en;
    }

    // Send email (non-blocking — don't fail the request if email fails)
    sendContactEmail({ name, email, phone, company, message, productName }).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
