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

  const { data: appRow, error: appErr } = await client.database
    .from('apps_catalog')
    .select('integration_kind, composio_toolkit_slug')
    .eq('slug', app_slug)
    .single()
  if (appErr || !appRow) return err(404, 'app_not_found', appErr?.message)
  if (appRow.integration_kind !== 'composio' || !appRow.composio_toolkit_slug) {
    return err(400, 'not_a_composio_app')
  }

  const authConfigId = Deno.env.get(
    `COMPOSIO_AUTH_CONFIG_${appRow.composio_toolkit_slug.toUpperCase()}`,
  )
  if (!authConfigId) return err(500, 'auth_config_not_provisioned')

  const composioApiKey = Deno.env.get('COMPOSIO_API_KEY')
  if (!composioApiKey) return err(500, 'composio_api_key_missing')

  const initRes = await fetch(
    'https://backend.composio.dev/api/v3/connected_accounts/initiate',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': composioApiKey,
      },
      body: JSON.stringify({
        auth_config_id: authConfigId,
        user_id: workspace_id,
      }),
    },
  )

  if (!initRes.ok) {
    const text = await initRes.text()
    return err(502, 'composio_initiate_failed', text)
  }
  const init = (await initRes.json()) as {
    id: string
    redirect_url?: string
    redirectUrl?: string
  }

  return json(200, {
    request_id: init.id,
    redirect_url: init.redirect_url ?? init.redirectUrl,
  })
}
