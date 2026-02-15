import { NextResponse } from 'next/server';
import { isTurnstileEnabled } from '@/lib/turnstile';
import { initializeSchema } from '@/lib/schema';
import { seedDatabase } from '@/lib/seed';

export async function GET() {
  initializeSchema();
  seedDatabase();
  return NextResponse.json({ enabled: isTurnstileEnabled() });
}
