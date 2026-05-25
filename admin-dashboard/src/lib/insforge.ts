import { createClient } from '@insforge/sdk'
import { env } from './env'

export const insforge = createClient({
  baseUrl: env.VITE_INSFORGE_URL,
  anonKey: env.VITE_INSFORGE_ANON_KEY,
})
