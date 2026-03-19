import { NextResponse } from 'next/server';
import { getChatDetail } from '@/lib/chat-service';
import {
  CHAT_OWNER_REQUIRED_ERROR,
  resolveChatOwnerContext,
} from '@/lib/chat-request';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ chatId: string }> },
) {
  try {
    const { searchParams } = new URL(request.url);
    const visitorId = searchParams.get('visitorId');
    const userId = searchParams.get('userId');
    const { chatId } = await context.params;

    const ownerContext = await resolveChatOwnerContext({ userId, visitorId });

    if (!ownerContext) {
      return NextResponse.json(
        { error: CHAT_OWNER_REQUIRED_ERROR },
        { status: 400 },
      );
    }

    const detail = await getChatDetail(
      ownerContext.owner,
      chatId,
      ownerContext.accessToken,
    );
    return NextResponse.json(detail);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to load the chat.';
    const status = message === 'Chat not found.' ? 404 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
