import { createClient } from '@insforge/sdk';
import { DEFAULT_MODEL } from '@/lib/constants';

let serverClient: ReturnType<typeof createClient> | null = null;

export const DEFAULT_SYSTEM_PROMPT =
  'You are a thoughtful assistant inside a product-grade web chatbot. Be concise, helpful, and clear.';

export function getConfiguredModel() {
  return process.env.INSFORGE_AI_MODEL?.trim() || DEFAULT_MODEL;
}

function getInsforgeConfig() {
  const baseUrl = process.env.INSFORGE_BASE_URL;
  const anonKey = process.env.INSFORGE_ANON_KEY;

  if (!baseUrl || !anonKey) {
    throw new Error(
      'Missing InsForge configuration. Set INSFORGE_BASE_URL and INSFORGE_ANON_KEY.',
    );
  }

  return { baseUrl, anonKey };
}

export function createInsforgeServerClient(options?: { accessToken?: string }) {
  const { baseUrl, anonKey } = getInsforgeConfig();

  return createClient({
    baseUrl,
    anonKey,
    isServerMode: true,
    ...(options?.accessToken
      ? { edgeFunctionToken: options.accessToken }
      : {}),
  });
}

export function getInsforgeServerClient() {
  if (!serverClient) {
    serverClient = createInsforgeServerClient();
  }

  return serverClient;
}
