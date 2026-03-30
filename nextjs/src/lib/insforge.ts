import { createClient } from "@insforge/sdk";

let serverClient: ReturnType<typeof createClient> | null = null;

function getInsforgeConfig() {
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
  const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

  if (!baseUrl || !anonKey) {
    throw new Error(
      "Missing InsForge configuration. Set NEXT_PUBLIC_INSFORGE_URL and NEXT_PUBLIC_INSFORGE_ANON_KEY.",
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
    ...(options?.accessToken ? { edgeFunctionToken: options.accessToken } : {}),
  });
}

export function getInsforgeServerClient() {
  if (!serverClient) {
    serverClient = createInsforgeServerClient();
  }

  return serverClient;
}
