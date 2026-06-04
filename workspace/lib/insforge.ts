import { createClient } from '@insforge/sdk';

let serverClient: ReturnType<typeof createClient> | null = null;
let serverClientConfig: { baseUrl: string; anonKey: string } | null = null;

function getInsforgeConfig() {
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
  const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

  if (!baseUrl || !anonKey) {
    throw new Error(
      'Missing InsForge configuration. Set NEXT_PUBLIC_INSFORGE_URL and NEXT_PUBLIC_INSFORGE_ANON_KEY.',
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
  const config = getInsforgeConfig();

  // IMPORTANT:
  // Avoid caching a client built with an outdated anonKey/baseUrl.
  // When you change .env.local during development, Next.js HMR may not fully
  // restart the server process, causing auth to fail with:
  // "Failed to get authentication configuration".
  if (
    !serverClient ||
    !serverClientConfig ||
    serverClientConfig.baseUrl !== config.baseUrl ||
    serverClientConfig.anonKey !== config.anonKey
  ) {
    serverClient = createInsforgeServerClient();
    serverClientConfig = config;
  }

  return serverClient;
}
