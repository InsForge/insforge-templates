import { createClient } from '@insforge/sdk';

// All InsForge calls in this template happen on the server (API routes
// + the BA mailer callback). The client minted here carries the HS256
// bridge JWT in `edgeFunctionToken`, which the InsForge gateway
// validates with INSFORGE_JWT_SECRET. RLS policies read the `sub`
// claim through `public.requesting_user_id()`.
//
// Routes call this AFTER reading the BA session via
// `getCurrentAuthState()` (see lib/auth-state.ts) — never construct a
// client with a stale or missing token.
export function createInsforgeServerClient(options?: { accessToken?: string }) {
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_BASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

  if (!baseUrl || !anonKey) {
    throw new Error(
      'Missing InsForge configuration. Set NEXT_PUBLIC_INSFORGE_BASE_URL and NEXT_PUBLIC_INSFORGE_ANON_KEY.',
    );
  }

  return createClient({
    baseUrl,
    anonKey,
    isServerMode: true,
    ...(options?.accessToken
      ? { edgeFunctionToken: options.accessToken }
      : {}),
  });
}
