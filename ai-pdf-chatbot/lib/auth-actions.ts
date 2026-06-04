'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

// All sign-in / sign-up / reset / OAuth flows now run client-side via
// `authClient` (lib/auth-client.ts). Only sign-out remains a server
// action so the sidebar's <form action={signOut}> works without
// additional client wiring.
export async function signOut() {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    // Best-effort — the BA session cookie is still cleared client-side
    // on the next request even if the server call hiccups.
  }
  redirect('/auth/sign-in');
}
