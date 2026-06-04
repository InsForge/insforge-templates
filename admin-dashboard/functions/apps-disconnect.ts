import { createClient } from 'npm:@insforge/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const err = (status: number, code: string, detail?: string) =>
  json(status, { error: code, detail })

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }
  if (req.method !== 'POST') return err(405, 'method_not_allowed')

  const authHeader = req.headers.get('Authorization')
  const userToken = authHeader ? authHeader.replace('Bearer ', '') : null
  if (!userToken) return err(401, 'unauthorized')

  const client = createClient({
    baseUrl: Deno.env.get('INSFORGE_BASE_URL'),
    edgeFunctionToken: userToken,
  })

  const { data: userData } = await client.auth.getCurrentUser()
  if (!userData?.user?.id) return err(401, 'unauthorized')

  let body: { app_slug?: string; workspace_id?: string }
  try {
    body = await req.json()
  } catch {
    return err(400, 'invalid_json')
  }
  const { app_slug, workspace_id } = body
  if (!app_slug || !workspace_id) return err(400, 'missing_fields')

  const { data: existing } = await client.database
    .from('app_connections')
    .select('config_json')
    .eq('workspace_id', workspace_id)
    .eq('app_slug', app_slug)
    .maybeSingle()

  const composioId = (existing?.config_json as Record<string, unknown> | null | undefined)
    ?.connected_account_id as string | undefined

  if (composioId) {
    const composioApiKey = Deno.env.get('COMPOSIO_API_KEY')
    if (composioApiKey) {
      try {
        const revokeRes = await fetch(
          `https://backend.composio.dev/api/v3/connected_accounts/${encodeURIComponent(composioId)}`,
          { method: 'DELETE', headers: { 'x-api-key': composioApiKey } },
        )
        if (!revokeRes.ok && revokeRes.status !== 404) {
          console.warn(
            `composio revoke failed: ${composioId} status=${revokeRes.status} body=${await revokeRes.text()}`,
          )
        }
      } catch (e) {
        console.warn(`composio revoke threw: ${composioId} err=${(e as Error).message}`)
      }
    }
  }

  const { error: delErr } = await client.database
    .from('app_connections')
    .delete()
    .eq('workspace_id', workspace_id)
    .eq('app_slug', app_slug)
  if (delErr) return err(500, 'db_delete_failed', delErr.message)

  return json(200, { ok: true })
}
