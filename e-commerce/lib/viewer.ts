import 'server-only';

import type { UserSchema } from '@insforge/sdk';
import type { AuthViewer } from '@/lib/types';

export const VISITOR_VIEWER: AuthViewer = {
  isAuthenticated: false,
  id: null,
  email: null,
  name: null,
  avatarUrl: null,
};

function normalizeName(user: UserSchema) {
  return user.profile?.name?.trim() || user.email?.split('@')[0] || null;
}

function normalizeAvatar(user: UserSchema) {
  return user.profile?.avatar_url?.trim() || null;
}

export async function buildViewer(user: UserSchema): Promise<AuthViewer> {
  return {
    isAuthenticated: true,
    id: user.id,
    email: user.email ?? null,
    name: normalizeName(user),
    avatarUrl: normalizeAvatar(user),
  };
}
