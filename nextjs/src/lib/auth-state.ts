import "server-only";

import type { UserSchema } from "@insforge/sdk";

import { getAccessToken, getRefreshToken } from "@/lib/auth-cookies";
import { createInsforgeServerClient } from "@/lib/insforge";

type AuthViewer = {
  isAuthenticated: boolean;
  id: string | null;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
};

const VISITOR_VIEWER: AuthViewer = {
  isAuthenticated: false,
  id: null,
  email: null,
  name: null,
  avatarUrl: null,
};

export type { AuthViewer };

function mapUserToViewer(user: UserSchema | null | undefined): AuthViewer {
  if (!user) {
    return VISITOR_VIEWER;
  }

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

  if (error || !data?.user) {
    return null;
  }

  return data.user;
}

export async function getCurrentUserDetails(): Promise<UserSchema | null> {
  const accessToken = await getAccessToken();
  const refreshToken = await getRefreshToken();

  if (accessToken) {
    const insforge = createInsforgeServerClient({ accessToken });
    const { data, error } = await insforge.auth.getCurrentUser();

    if (!error && data.user) {
      return data.user;
    }
  }

  if (refreshToken) {
    return refreshAuthenticatedUser(refreshToken);
  }

  return null;
}

export async function getCurrentViewer(): Promise<AuthViewer> {
  const user = await getCurrentUserDetails();
  return mapUserToViewer(user);
}
