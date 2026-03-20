import 'server-only';

import { redirect } from 'next/navigation';
import { setAuthCookies } from '@/lib/auth-cookies';
import { getCurrentAuthState } from '@/lib/auth-state';

type AuthState = Awaited<ReturnType<typeof getCurrentAuthState>>;

export type AuthenticatedSession = Omit<AuthState, 'accessToken'> & {
  accessToken: string;
  viewer: AuthState['viewer'] & {
    isAuthenticated: true;
    id: string;
  };
};

export async function requireAuthenticatedSession(): Promise<AuthenticatedSession> {
  const authState = await getCurrentAuthState();

  if (!authState.viewer.isAuthenticated || !authState.viewer.id || !authState.accessToken) {
    redirect('/auth/sign-in');
  }

  return authState as AuthenticatedSession;
}

export async function persistRefreshedSession(authState: {
  refreshedAccessToken: string | null;
  refreshedRefreshToken: string | null;
}) {
  if (authState.refreshedAccessToken && authState.refreshedRefreshToken) {
    await setAuthCookies(authState.refreshedAccessToken, authState.refreshedRefreshToken);
  }
}
