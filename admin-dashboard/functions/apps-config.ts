import { createClient } from 'npm:@insforge/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const err = (status: number, code: string, detail?: string) =>
  json(status, { error: code, detail })

const COMPOSIO_TOOLKITS = [
  'github',
  'notion',
  'slack',
  'discord',
  'figma',
  'linear',
  'vercel',
] as const

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }
  if (req.method !== 'GET') return err(405, 'method_not_allowed')

  const authHeader = req.headers.get('Authorization')
  const userToken = authHeader ? authHeader.replace('Bearer ', '') : null
  if (!userToken) return err(401, 'unauthorized')

  const client = createClient({
    baseUrl: Deno.env.get('INSFORGE_BASE_URL'),
    edgeFunctionToken: userToken,
  })
  const { data: userData } = await client.auth.getCurrentUser()
  if (!userData?.user?.id) return err(401, 'unauthorized')

  const composio_enabled = !!Deno.env.get('COMPOSIO_API_KEY')
  const configured_toolkits = COMPOSIO_TOOLKITS.filter(
    (slug) => !!Deno.env.get(`COMPOSIO_AUTH_CONFIG_${slug.toUpperCase()}`),
  )

  return json(200, { composio_enabled, configured_toolkits })
}
