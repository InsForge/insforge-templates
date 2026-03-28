import { streamText } from 'ai';
import { createGateway } from '@ai-sdk/gateway';
import type { AIProvider, StreamCompletionParams, UserContentPart } from '@/lib/ai/types';

/**
 * Create a Vercel AI Gateway provider instance.
 *
 * Auth: uses AI_GATEWAY_API_KEY env var, or falls back to Vercel OIDC
 * (automatic on Vercel deployments — zero config needed).
 *
 * The gateway natively accepts `provider/model` format IDs
 * (e.g. "openai/gpt-4o-mini", "anthropic/claude-sonnet-4.5"),
 * so no model mapping is required.
 */
function getGateway() {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  const baseURL = process.env.AI_GATEWAY_BASE_URL;

  return createGateway({
    ...(apiKey ? { apiKey } : {}),
    ...(baseURL ? { baseURL } : {}),
  });
}

/**
 * Build BYOK (Bring Your Own Key) options from environment variables.
 * Set OPENAI_API_KEY, ANTHROPIC_API_KEY, etc. to pass provider
 * credentials through the gateway without configuring them in the
 * Vercel dashboard.
 */
function buildByokOptions(): Record<string, Record<string, Array<{ apiKey: string }>>> {
  const byok: Record<string, Array<{ apiKey: string }>> = {};

  const providers: Record<string, string | undefined> = {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    google: process.env.GOOGLE_API_KEY,
    'x-ai': process.env.XAI_API_KEY,
    deepseek: process.env.DEEPSEEK_API_KEY,
    minimax: process.env.MINIMAX_API_KEY,
  };

  for (const [name, key] of Object.entries(providers)) {
    if (key) {
      byok[name] = [{ apiKey: key }];
    }
  }

  if (Object.keys(byok).length === 0) return {} as Record<string, Record<string, Array<{ apiKey: string }>>>;
  return { byok } as Record<string, Record<string, Array<{ apiKey: string }>>>;
}

const PROVIDER_KEY_ENV: Record<string, string> = {
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  google: 'GOOGLE_API_KEY',
  'x-ai': 'XAI_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
  minimax: 'MINIMAX_API_KEY',
};

/**
 * Fail fast if the selected model's provider has no API key configured.
 */
function assertProviderKeyExists(modelId: string) {
  if (!modelId.includes('/')) return;

  const provider = modelId.split('/')[0];
  const envName = PROVIDER_KEY_ENV[provider];

  if (envName && !process.env[envName]) {
    throw new Error(
      `Model "${modelId}" requires ${envName} to be set. ` +
      `Add it to your .env.local to use this provider.`,
    );
  }
}

/**
 * Convert InsForge-shaped multipart content to Vercel AI SDK format.
 */
function convertContent(
  content: string | UserContentPart[],
): string | Array<{ type: 'text'; text: string } | { type: 'image'; image: URL } | { type: 'file'; data: string; mimeType: string }> {
  if (typeof content === 'string') return content;

  const parts: Array<
    | { type: 'text'; text: string }
    | { type: 'image'; image: URL }
    | { type: 'file'; data: string; mimeType: string }
  > = [];

  for (const part of content) {
    if (part.type === 'text') {
      parts.push({ type: 'text', text: part.text });
    } else if (part.type === 'image_url') {
      parts.push({ type: 'image', image: new URL(part.image_url.url) });
    } else if (part.type === 'file') {
      const dataUrlMatch = part.file.file_data.match(
        /^data:([^;]+);base64,(.+)$/,
      );
      if (dataUrlMatch) {
        parts.push({
          type: 'file',
          data: dataUrlMatch[2],
          mimeType: dataUrlMatch[1],
        });
      } else {
        parts.push({
          type: 'text',
          text: `[Attached file: ${part.file.filename}] (Binary content could not be forwarded to this model.)`,
        });
      }
    }
  }

  return parts.length === 1 && parts[0].type === 'text' ? parts[0].text : parts;
}

export function createVercelAIProvider(): AIProvider {
  return {
    async streamCompletion(params: StreamCompletionParams) {
      assertProviderKeyExists(params.model);

      const gw = getGateway();
      const model = gw(params.model);

      const messages = params.messages.map((msg) => ({
        role: msg.role,
        content: convertContent(msg.content),
      })) as Parameters<typeof streamText>[0]['messages'];

      const result = streamText({
        model,
        messages: messages!,
        providerOptions: {
          gateway: buildByokOptions(),
        },
      });

      return {
        async *[Symbol.asyncIterator]() {
          for await (const delta of result.textStream) {
            if (delta) yield delta;
          }
        },
      };
    },
  };
}
