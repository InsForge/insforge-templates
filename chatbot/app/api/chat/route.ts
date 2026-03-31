import { NextResponse } from 'next/server';
import { streamMessage } from '@/lib/chat-service';
import {
  CHAT_OWNER_REQUIRED_ERROR,
  resolveChatOwnerContext,
} from '@/lib/chat-request';
import type { SendMessageRequest } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SendMessageRequest;

    if (!body.userId) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 },
      );
    }

    const context = await resolveChatOwnerContext({
      userId: body.userId,
    });

    if (!context) {
      return NextResponse.json(
        { error: CHAT_OWNER_REQUIRED_ERROR },
        { status: 400 },
      );
    }

    if (!body.input?.trim()) {
      return NextResponse.json(
        { error: 'input is required.' },
        { status: 400 },
      );
    }

    const stream = await streamMessage({
      owner: context.owner,
      chatId: body.chatId,
      text: body.input,
      model: body.model,
      attachments: body.attachments,
      accessToken: context.accessToken,
    });

    return new Response(stream, {
      headers: {
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'Content-Type': 'application/x-ndjson; charset=utf-8',
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to send the message.';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
