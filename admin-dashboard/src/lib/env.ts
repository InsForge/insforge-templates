import { z } from 'zod'

const schema = z.object({
  VITE_INSFORGE_URL: z.string().url(),
  VITE_INSFORGE_ANON_KEY: z.string().min(1),
})

const parsed = schema.safeParse(import.meta.env)

if (!parsed.success) {
  // Surface a clear message in the browser console so missing config is obvious.
  console.error(
    'Missing InsForge env vars. Copy .env.example to .env and fill VITE_INSFORGE_URL + VITE_INSFORGE_ANON_KEY.',
    parsed.error.flatten().fieldErrors,
  )
  throw new Error('Missing InsForge env vars')
}

export const env = parsed.data
