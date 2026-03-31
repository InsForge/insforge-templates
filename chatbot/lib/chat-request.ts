import { getAccessToken, getRefreshToken, setAuthCookies } from '@/lib/auth-cookies';
import { createInsforgeServerClient } from '@/lib/insforge';
import type { ChatOwner } from '@/lib/types';

export const CHAT_OWNER_REQUIRED_ERROR = 'userId is required.';

async function resolveAccessToken(): Promise<string | null> {
  const accessToken = await getAccessToken();
  if (accessToken) return accessToken;

  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  const insforge = createInsforgeServerClient();
  const { data, error } = await insforge.auth.refreshSession({ refreshToken });

  if (error || !data?.accessToken || !data.refreshToken) {
    return null;
  }

  await setAuthCookies(data.accessToken, data.refreshToken);
  return data.accessToken;
}

export async function resolveChatOwnerContext(input: {
  userId: string | null;
}): Promise<{ owner: ChatOwner; accessToken: string | null } | null> {
  const userId = input.userId?.trim() || null;

  if (!userId) {
    return null;
  }

  return {
    owner: { userId },
    accessToken: await resolveAccessToken(),
  };
}
