import 'server-only';

import type { UserSchema } from '@insforge/sdk';
import { getAccessToken, getRefreshToken } from '@/lib/auth-cookies';
import { createInsforgeServerClient } from '@/lib/insforge';
import type { AuthViewer } from '@/lib/types';

const VISITOR_VIEWER: AuthViewer = {
  isAuthenticated: false,
  id: null,
  email: null,
  name: null,
  avatarUrl: null,
};

function mapUserToViewer(user: UserSchema | null | undefined): AuthViewer {
  if (!user) return VISITOR_VIEWER;

  return {
    isAuthenticated: true,
    id: user.id,
    email: user.email,
    name: user.profile?.name?.trim() || null,
    avatarUrl: user.profile?.avatar_url?.trim() || null,
  };
}

async function refreshAuthenticatedUser(refreshToken: string) {
  const insforge = createInsforgeServerClient();
  const { data, error } = await insforge.auth.refreshSession({ refreshToken });

  if (error || !data?.accessToken || !data.user) {
    return null;
  }

  return data.user;
}

export async function getCurrentViewer(): Promise<AuthViewer> {
  const accessToken = await getAccessToken();
  const refreshToken = await getRefreshToken();

  if (accessToken) {
    const insforge = createInsforgeServerClient({ accessToken });
    const { data, error } = await insforge.auth.getCurrentUser();

    if (!error && data.user) {
      return mapUserToViewer(data.user);
    }
  }

  if (refreshToken) {
    const user = await refreshAuthenticatedUser(refreshToken);
    return mapUserToViewer(user);
  }

  return VISITOR_VIEWER;
}
