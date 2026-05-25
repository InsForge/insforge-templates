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
  if (!authState.refreshedAccessToken || !authState.refreshedRefreshToken) {
    return;
  }
  try {
    await setAuthCookies(authState.refreshedAccessToken, authState.refreshedRefreshToken);
  } catch {
    // Setting cookies from a Server Component is only allowed before rendering
    // starts (Next.js 15+). When that constraint trips, the refreshed tokens are
    // still used for the current request — only persistence to subsequent
    // requests is dropped. The user will simply re-authenticate sooner.
  }
}
