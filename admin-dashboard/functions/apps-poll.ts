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

  let body: { request_id?: string; app_slug?: string; workspace_id?: string }
  try {
    body = await req.json()
  } catch {
    return err(400, 'invalid_json')
  }
  const { request_id, app_slug, workspace_id } = body
  if (!request_id || !app_slug || !workspace_id) return err(400, 'missing_fields')

  const { data: appRow, error: appErr } = await client.database
    .from('apps_catalog')
    .select('slug')
    .eq('slug', app_slug)
    .single()
  if (appErr || !appRow) return err(404, 'app_not_found', appErr?.message)

  const composioApiKey = Deno.env.get('COMPOSIO_API_KEY')
  if (!composioApiKey) return err(500, 'composio_api_key_missing')

  const res = await fetch(
    `https://backend.composio.dev/api/v3/connected_accounts/${encodeURIComponent(request_id)}`,
    { headers: { 'x-api-key': composioApiKey } },
  )
  if (!res.ok) return err(502, 'composio_get_failed', await res.text())

  const account = (await res.json()) as {
    id: string
    status: string
    word_id?: string
    data?: Record<string, unknown>
    created_at?: string
  }

  const FAILED_STATES = ['FAILED', 'EXPIRED', 'INACTIVE', 'DELETED']
  if (account.status !== 'ACTIVE') {
    if (FAILED_STATES.includes(account.status)) {
      return json(200, { status: 'failed', detail: account.status })
    }
    return json(200, { status: 'pending', detail: account.status })
  }

  const dataObj = (account.data ?? {}) as Record<string, unknown>
  const extraToken = (dataObj.extra_token_data as Record<string, unknown> | undefined) ?? {}
  const team = (extraToken.team as { name?: string } | undefined) ?? {}
  const account_label =
    (dataObj.account_label as string | undefined) ??
    (dataObj.user_email as string | undefined) ??
    (dataObj.email as string | undefined) ??
    (dataObj.login as string | undefined) ??
    (dataObj.name as string | undefined) ??
    team.name ??
    account.word_id ??
    null

  const { error: upsertErr } = await client.database
    .from('app_connections')
    .upsert(
      {
        workspace_id,
        app_slug,
        status: 'connected',
        connected_by: userData.user.id,
        connected_at: new Date().toISOString(),
        config_json: {
          kind: 'composio',
          connected_account_id: account.id,
          account_label,
          connected_at_provider: account.created_at ?? null,
        },
      },
      { onConflict: 'workspace_id,app_slug' },
    )

  if (upsertErr) return err(500, 'db_upsert_failed', upsertErr.message)

  return json(200, { status: 'connected', account_label })
}
