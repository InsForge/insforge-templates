import 'server-only';

import jwt from 'jsonwebtoken';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import type { AuthViewer } from '@/lib/types';

const VISITOR_VIEWER: AuthViewer = {
  isAuthenticated: false,
  id: null,
  email: null,
  name: null,
};

// Server-side read of the current viewer + a freshly-minted HS256 bridge
// JWT to authenticate downstream InsForge calls. The route consumers
// pattern-match `auth.viewer.isAuthenticated`, `auth.viewer.id`, and
// `auth.accessToken` — keep those fields stable.
export async function getCurrentAuthState(): Promise<{
  viewer: AuthViewer;
  accessToken: string | null;
}> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { viewer: VISITOR_VIEWER, accessToken: null };
  }

  const accessToken = jwt.sign(
    {
      sub: session.user.id,
      role: 'authenticated',
      aud: 'insforge-api',
    },
    process.env.INSFORGE_JWT_SECRET!,
    { algorithm: 'HS256', expiresIn: '1h' },
  );

  return {
    viewer: {
      isAuthenticated: true,
      id: session.user.id,
      email: session.user.email ?? null,
      name: session.user.name ?? null,
    },
    accessToken,
  };
}
