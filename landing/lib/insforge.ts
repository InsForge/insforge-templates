import 'server-only';

import { createClient } from '@insforge/sdk';

let cached: ReturnType<typeof createClient> | null = null;
let cachedConfig: { baseUrl: string; anonKey: string } | null = null;

function readConfig() {
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
  const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
  if (!baseUrl || !anonKey) {
    throw new Error(
      'Missing InsForge config. Set NEXT_PUBLIC_INSFORGE_URL and NEXT_PUBLIC_INSFORGE_ANON_KEY in .env.local.',
    );
  }
  return { baseUrl, anonKey };
}

export function createInsforgeServerClient(options?: { accessToken?: string }) {
  const { baseUrl, anonKey } = readConfig();
  return createClient({
    baseUrl,
    anonKey,
    isServerMode: true,
    ...(options?.accessToken ? { edgeFunctionToken: options.accessToken } : {}),
  });
}

export function getInsforgeServerClient() {
  const config = readConfig();
  if (
    !cached ||
    !cachedConfig ||
    cachedConfig.baseUrl !== config.baseUrl ||
    cachedConfig.anonKey !== config.anonKey
  ) {
    cached = createInsforgeServerClient();
    cachedConfig = config;
  }
  return cached;
}
