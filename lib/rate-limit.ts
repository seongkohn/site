import { getDb } from './db';

/**
 * SQLite-backed rate limiter. Returns true if the key has exceeded maxAttempts
 * within the sliding window defined by windowMs.
 */
export function isRateLimited(key: string, maxAttempts: number, windowMs: number): boolean {
  const db = getDb();
  const now = Date.now();

  const row = db.prepare('SELECT count, reset_at FROM rate_limits WHERE key = ?').get(key) as
    | { count: number; reset_at: number }
    | undefined;

  if (!row || now > row.reset_at) {
    // Window expired or first request — start a new window
    db.prepare(
      'INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = 1, reset_at = ?'
    ).run(key, now + windowMs, now + windowMs);
    return false;
  }

  // Increment count within existing window
  db.prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?').run(key);
  return row.count + 1 > maxAttempts;
}
