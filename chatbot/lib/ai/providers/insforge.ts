import type { AIProvider, StreamCompletionParams } from '@/lib/ai/types';

type InsforgeClient = {
  ai: {
    chat: {
      completions: {
        create(params: Record<string, unknown>): Promise<AsyncIterable<{
          choices?: Array<{ delta?: { content?: unknown } }>;
        }>>;
      };
    };
  };
};

function extractDeltaText(content: unknown): string {
  if (typeof content === 'string') return content;

  if (Array.isArray(content)) {
    return content
      .map((part) =>
        part && typeof part === 'object' && 'text' in part && typeof part.text === 'string'
          ? part.text
          : '',
      )
      .join('');
  }

  return '';
}

export function createInsforgeAIProvider(client: InsforgeClient): AIProvider {
  return {
    async streamCompletion(params: StreamCompletionParams) {
      const raw = await client.ai.chat.completions.create({
        model: params.model,
        messages: params.messages,
        ...(params.fileParser && { fileParser: params.fileParser }),
        stream: true,
      });

      return {
        async *[Symbol.asyncIterator]() {
          for await (const chunk of raw) {
            const text = extractDeltaText(chunk.choices?.[0]?.delta?.content);
            if (text) yield text;
          }
        },
      };
    },
  };
}
