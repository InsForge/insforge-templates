import { NextResponse } from 'next/server';
import { exchangeAuthCode } from '@/lib/auth-actions';

export async function GET(request: Request) {
  const url = new URL(request.url);
  // InsForge OAuth shared callback returns the exchangeable code as `insforge_code`,
  // not the OAuth-spec `code`.
  const code = url.searchParams.get('insforge_code');
  const error = url.searchParams.get('error');

  const base = process.env.NEXT_PUBLIC_APP_URL ?? url.origin;

  if (error) {
    return NextResponse.redirect(
      new URL(`/sign-in?error=${encodeURIComponent(error)}`, base),
    );
  }
  if (!code) {
    return NextResponse.redirect(new URL('/sign-in?error=missing_code', base));
  }

  const result = await exchangeAuthCode(code);
  if (!result.success) {
    return NextResponse.redirect(
      new URL(`/sign-in?error=${encodeURIComponent(result.error)}`, base),
    );
  }
  return NextResponse.redirect(new URL('/dashboard', base));
}
