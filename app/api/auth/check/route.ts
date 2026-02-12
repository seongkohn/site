import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';

export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  return NextResponse.json({ username: user.username });
}
