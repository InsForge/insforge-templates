'use client';

import { createClient } from '@insforge/sdk';

let client: ReturnType<typeof createClient> | null = null;

export function getInsforgeBrowserClient() {
  if (client) return client;
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
  const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
  if (!baseUrl || !anonKey) {
    throw new Error('Missing InsForge configuration.');
  }
  client = createClient({ baseUrl, anonKey });
  return client;
}
