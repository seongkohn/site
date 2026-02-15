import { getDb } from '@/lib/db';

const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET || '';

export function isTurnstileEnabled(): boolean {
  try {
    const db = getDb();
    const row = db.prepare("SELECT value FROM settings WHERE key = 'turnstile_enabled'").get() as { value: string } | undefined;
    return row?.value === 'true';
  } catch {
    return false;
  }
}

export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  if (!isTurnstileEnabled()) return true;

  if (!token) return false;

  try {
    const body: Record<string, string> = {
      secret: TURNSTILE_SECRET,
      response: token,
    };
    if (ip) body.remoteip = ip;

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}
