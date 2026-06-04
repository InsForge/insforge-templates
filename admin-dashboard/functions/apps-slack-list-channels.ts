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

type Channel = { id: string; name: string; is_private: boolean }

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

  let body: { workspace_id?: string }
  try {
    body = await req.json()
  } catch {
    return err(400, 'invalid_json')
  }
  const { workspace_id } = body
  if (!workspace_id) return err(400, 'missing_fields')

  const { data: connRow, error: connErr } = await client.database
    .from('app_connections')
    .select('config_json, status')
    .eq('workspace_id', workspace_id)
    .eq('app_slug', 'slack')
    .single()
  if (connErr || !connRow) return err(404, 'slack_not_connected')
  if (connRow.status !== 'connected') return err(409, 'slack_not_connected')

  const connectedAccountId = (connRow.config_json as { connected_account_id?: string })
    ?.connected_account_id
  if (!connectedAccountId) return err(404, 'slack_not_connected')

  const composioApiKey = Deno.env.get('COMPOSIO_API_KEY')
  if (!composioApiKey) return err(500, 'composio_api_key_missing')

  const execRes = await fetch(
    'https://backend.composio.dev/api/v3/tools/execute/SLACK_LIST_ALL_CHANNELS',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': composioApiKey },
      body: JSON.stringify({
        user_id: workspace_id,
        connected_account_id: connectedAccountId,
        arguments: { limit: 1000, exclude_archived: true, types: 'public_channel,private_channel' },
      }),
    },
  )

  if (!execRes.ok) {
    return err(502, 'composio_execute_failed', await execRes.text())
  }
  const execBody = (await execRes.json()) as {
    successful?: boolean
    data?: { channels?: Array<{ id: string; name: string; is_private?: boolean }> }
    error?: string
  }
  if (!execBody.successful) return err(502, 'composio_execute_failed', execBody.error ?? 'unknown')

  const channels: Channel[] = (execBody.data?.channels ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    is_private: !!c.is_private,
  }))
  channels.sort((a, b) => a.name.localeCompare(b.name))

  return json(200, { channels })
}
