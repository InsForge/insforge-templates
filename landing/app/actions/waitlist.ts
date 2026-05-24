'use server';

import { getInsforgeServerClient } from '@/lib/insforge';

export type WaitlistState =
  | { ok: false; error?: string }
  | { ok: true; message?: string };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const ALLOWED_SOURCES = new Set(['hero', 'footer', 'cta-section', 'other']);

export async function submitWaitlist(
  _prev: WaitlistState,
  formData: FormData,
): Promise<WaitlistState> {
  const email = String(formData.get('email') ?? '').trim();
  const rawSource = String(formData.get('source') ?? 'hero');
  const source = ALLOWED_SOURCES.has(rawSource) ? rawSource : 'other';

  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, error: 'Enter a valid email.' };
  }

  const insforge = getInsforgeServerClient();
  const { error } = await insforge.database.from('waitlist').insert([{ email, source }]);

  if (error?.code === '23505') {
    return { ok: true, message: "You're already on the list." };
  }
  if (error) {
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }
  return { ok: true, message: "You're in — we'll be in touch soon." };
}
