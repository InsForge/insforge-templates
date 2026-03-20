import 'server-only';

import { getAccessToken, getRefreshToken } from '@/lib/auth-cookies';
import { createInsforgeServerClient } from '@/lib/insforge';
import type { AuthViewer } from '@/lib/types';
import { buildViewer, VISITOR_VIEWER } from '@/lib/viewer';

async function refreshAuthenticatedUser(refreshToken: string) {
  const insforge = createInsforgeServerClient();
  const { data, error } = await insforge.auth.refreshSession({ refreshToken });

  if (error || !data?.accessToken || !data?.refreshToken || !data.user) {
    return null;
  }

  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: data.user,
  };
}

export async function getCurrentAuthState(): Promise<{
  viewer: AuthViewer;
  accessToken: string | null;
  refreshToken: string | null;
  refreshedAccessToken: string | null;
  refreshedRefreshToken: string | null;
}> {
  const accessToken = await getAccessToken();
  const refreshToken = await getRefreshToken();

  if (accessToken) {
    const insforge = createInsforgeServerClient({ accessToken });
    const { data, error } = await insforge.auth.getCurrentUser();

    if (!error && data.user) {
      return {
        viewer: await buildViewer(data.user),
        accessToken,
        refreshToken,
        refreshedAccessToken: null,
        refreshedRefreshToken: null,
      };
    }
  }

  if (refreshToken) {
    const refreshed = await refreshAuthenticatedUser(refreshToken);

    if (refreshed) {
      return {
        viewer: await buildViewer(refreshed.user),
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        refreshedAccessToken: refreshed.accessToken,
        refreshedRefreshToken: refreshed.refreshToken,
      };
    }
  }

  return {
    viewer: VISITOR_VIEWER,
    accessToken: null,
    refreshToken,
    refreshedAccessToken: null,
    refreshedRefreshToken: null,
  };
}
