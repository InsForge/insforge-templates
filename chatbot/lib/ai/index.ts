import type { AIProvider } from '@/lib/ai/types';

export type { AIProvider, AIChatMessage, UserContentPart, FileParserOptions, StreamCompletionParams } from '@/lib/ai/types';

type ProviderName = 'insforge' | 'vercel';

export function getAIProviderName(): ProviderName {
  const raw = process.env.AI_PROVIDER?.trim().toLowerCase();

  if (!raw || raw === 'insforge') return 'insforge';
  if (raw === 'vercel') return 'vercel';

  throw new Error(
    `Unknown AI_PROVIDER "${raw}". Supported values: insforge, vercel.`,
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createAIProvider(insforgeClient?: any): Promise<AIProvider> {
  const name = getAIProviderName();

  if (name === 'insforge') {
    if (!insforgeClient) {
      throw new Error('InsForge client is required for the insforge AI provider.');
    }
    const { createInsforgeAIProvider } = await import('@/lib/ai/providers/insforge');
    return createInsforgeAIProvider(insforgeClient as Parameters<typeof createInsforgeAIProvider>[0]);
  }

  const { createVercelAIProvider } = await import('@/lib/ai/providers/vercel');
  return createVercelAIProvider();
}
