import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PREFIXES = ['/chat', '/documents', '/api/documents', '/api/chats', '/api/chat'];

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const needsAuth = PROTECTED_PREFIXES.some(
    (p) => url.pathname === p || url.pathname.startsWith(`${p}/`),
  );
  if (!needsAuth) return NextResponse.next();

  const hasToken = Boolean(req.cookies.get('insforge_access_token')?.value);
  if (hasToken) return NextResponse.next();

  const signIn = new URL('/auth/sign-in', req.url);
  signIn.searchParams.set('redirect', url.pathname);
  return NextResponse.redirect(signIn);
}

export const config = {
  matcher: ['/chat/:path*', '/documents/:path*', '/api/(documents|chats|chat)/:path*'],
};
