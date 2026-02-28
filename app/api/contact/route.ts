import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { initializeSchema } from '@/lib/schema';
import { seedDatabase } from '@/lib/seed';
import { sendContactEmail } from '@/lib/email';
import { verifyTurnstile } from '@/lib/turnstile';
import { isRateLimited } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/request-ip';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    initializeSchema();
    seedDatabase();

    const ip = getClientIp(request);

    // Rate limit: 10 submissions per IP per 15 minutes
    if (isRateLimited(`contact:${ip}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many submissions. Please try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      company,
      organization,
      message,
      product_id,
      lang,
      turnstileToken,
    } = body;
    const companyValue = organization || company || null;
    const emailLang = lang === 'ko' ? 'ko' : 'en';

    if (!await verifyTurnstile(turnstileToken || '', ip || undefined)) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
    }

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Save to leads table
    db.prepare(`
      INSERT INTO leads (name, email, phone, company, message, product_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, email, phone || null, companyValue, message, product_id || null);

    // Get product name if product_id provided
    let productName: string | undefined;
    if (product_id) {
      const product = db.prepare('SELECT name_en FROM products WHERE id = ?').get(product_id) as { name_en: string } | undefined;
      productName = product?.name_en;
    }

    // Send email
    const emailSent = await sendContactEmail({
      name,
      email,
      phone,
      company: companyValue || undefined,
      message,
      productName,
      lang: emailLang,
    });

    return NextResponse.json({ success: true, emailSent });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
