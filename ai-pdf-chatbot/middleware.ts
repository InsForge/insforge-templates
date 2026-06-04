import { getSessionCookie } from 'better-auth/cookies';
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PREFIXES = ['/chat', '/documents', '/api/documents', '/api/chats', '/api/chat'];

// Cookie-only auth gate — BA's `getSessionCookie` reads the session
// cookie without hitting the database. It's an optimistic check (any
// non-expired BA cookie passes); the route handlers still validate
// the session for real via auth.api.getSession() before doing work.
export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const needsAuth = PROTECTED_PREFIXES.some(
    (p) => url.pathname === p || url.pathname.startsWith(`${p}/`),
  );
  if (!needsAuth) return NextResponse.next();

  const cookie = getSessionCookie(req);
  if (cookie) return NextResponse.next();

  const signIn = new URL('/auth/sign-in', req.url);
  signIn.searchParams.set('redirect', url.pathname);
  return NextResponse.redirect(signIn);
}

export const config = {
  matcher: ['/chat/:path*', '/documents/:path*', '/api/(documents|chats|chat)/:path*'],
};
