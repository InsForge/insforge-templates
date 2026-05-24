'use server';

import { redirect } from 'next/navigation';
import {
  clearAuthCookies,
  consumePkceVerifier,
  setAuthCookies,
  setPkceVerifier,
} from '@/lib/auth-cookies';
import { getInsforgeServerClient } from '@/lib/insforge';

export type AuthResult = { success: true } | { success: false; error: string };

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const insforge = getInsforgeServerClient();
  const { data, error } = await insforge.auth.signInWithPassword({ email, password });

  if (error) {
    return { success: false, error: error.message ?? 'Sign in failed.' };
  }
  if (!data?.accessToken || !data?.refreshToken) {
    return { success: false, error: 'Sign in failed.' };
  }

  await setAuthCookies(data.accessToken, data.refreshToken);
  return { success: true };
}

export async function signUp(email: string, password: string): Promise<AuthResult> {
  const insforge = getInsforgeServerClient();
  const { data, error } = await insforge.auth.signUp({ email, password });

  if (error) {
    return { success: false, error: error.message ?? 'Sign up failed.' };
  }
  if (data?.accessToken && data?.refreshToken) {
    await setAuthCookies(data.accessToken, data.refreshToken);
  }
  return { success: true };
}

export async function getOAuthUrl(
  provider: 'google' | 'github',
): Promise<{ url: string } | { error: string }> {
  const insforge = getInsforgeServerClient();
  const origin =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000');

  type OAuthProvider = Parameters<typeof insforge.auth.signInWithOAuth>[0]['provider'];

  const { data, error } = await insforge.auth.signInWithOAuth({
    provider: provider as OAuthProvider,
    redirectTo: `${origin}/auth/callback`,
    skipBrowserRedirect: true,
  });

  if (error || !data?.url) {
    return { error: error?.message ?? 'OAuth provider not configured.' };
  }
  if (data.codeVerifier) {
    await setPkceVerifier(data.codeVerifier);
  }
  return { url: data.url };
}

export async function exchangeAuthCode(code: string): Promise<AuthResult> {
  const insforge = getInsforgeServerClient();
  const codeVerifier = await consumePkceVerifier();
  const { data, error } = await insforge.auth.exchangeOAuthCode(code, codeVerifier ?? undefined);

  if (error || !data?.accessToken) {
    return { success: false, error: error?.message ?? 'Code exchange failed.' };
  }
  if (data.refreshToken) {
    await setAuthCookies(data.accessToken, data.refreshToken);
  }
  return { success: true };
}

export async function signOut() {
  const insforge = getInsforgeServerClient();
  try {
    await insforge.auth.signOut();
  } catch {
    // best-effort — still clear cookies + redirect
  }
  await clearAuthCookies();
  redirect('/');
}
