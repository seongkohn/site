import { NextResponse } from 'next/server';
import { isIndexingEnabled } from '@/lib/site-visibility';

export function middleware() {
  const response = NextResponse.next();

  if (!isIndexingEnabled()) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet, noimageindex');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
