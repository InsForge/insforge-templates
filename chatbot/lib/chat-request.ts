import { getAccessToken } from '@/lib/auth-cookies';
import type { ChatOwner } from '@/lib/types';

export const CHAT_OWNER_REQUIRED_ERROR = 'visitorId or userId is required.';

export async function resolveChatOwnerContext(input: {
  userId: string | null;
  visitorId: string | null;
}): Promise<{ owner: ChatOwner; accessToken: string | null } | null> {
  const userId = input.userId?.trim() || null;
  const visitorId = input.visitorId?.trim() || null;

  if (!userId && !visitorId) {
    return null;
  }

  if (userId) {
    return {
      owner: { userId },
      accessToken: await getAccessToken(),
    };
  }

  return {
    owner: { visitorId: visitorId! },
    accessToken: null,
  };
}
