import { NextResponse } from 'next/server';
import { listChats } from '@/lib/chat-service';
import {
  CHAT_OWNER_REQUIRED_ERROR,
  resolveChatOwnerContext,
} from '@/lib/chat-request';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const visitorId = searchParams.get('visitorId');
    const userId = searchParams.get('userId');

    const context = await resolveChatOwnerContext({ userId, visitorId });

    if (!context) {
      return NextResponse.json(
        { error: CHAT_OWNER_REQUIRED_ERROR },
        { status: 400 },
      );
    }

    const chats = await listChats(context.owner, context.accessToken);
    return NextResponse.json(chats);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to load chats.';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
