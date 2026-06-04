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

const STATUS_LABEL: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
  canceled: 'Canceled',
}

const PRIORITY_LABEL: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

// Slack mrkdwn treats &, <, > as control chars (mentions, links). Escape any
// user-controlled text so a task titled "<!channel>" can't blast a channel.
function escapeSlack(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function formatMessage(task: {
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
}) {
  const lines: string[] = []
  lines.push(`*${escapeSlack(task.title)}*`)
  lines.push(
    `${STATUS_LABEL[task.status] ?? task.status} · ${PRIORITY_LABEL[task.priority] ?? task.priority}` +
      (task.due_date ? ` · due ${escapeSlack(task.due_date)}` : ''),
  )
  if (task.description) lines.push('', escapeSlack(task.description.slice(0, 500)))
  return lines.join('\n')
}

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

  let body: { task_id?: string; workspace_id?: string; channel?: string }
  try {
    body = await req.json()
  } catch {
    return err(400, 'invalid_json')
  }
  const { task_id, workspace_id, channel } = body
  if (!task_id || !workspace_id || !channel) return err(400, 'missing_fields')

  const { data: task, error: taskErr } = await client.database
    .from('tasks')
    .select('id, title, description, status, priority, due_date, workspace_id')
    .eq('id', task_id)
    .single()
  if (taskErr || !task) return err(404, 'task_not_found', taskErr?.message)
  if (task.workspace_id !== workspace_id) return err(403, 'task_workspace_mismatch')

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

  const text = formatMessage(task)

  const execRes = await fetch(
    'https://backend.composio.dev/api/v3/tools/execute/SLACK_SEND_MESSAGE',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': composioApiKey },
      body: JSON.stringify({
        user_id: workspace_id,
        connected_account_id: connectedAccountId,
        arguments: { channel, text, mrkdwn: true },
      }),
    },
  )

  if (!execRes.ok) {
    return err(502, 'composio_execute_failed', await execRes.text())
  }
  const execBody = (await execRes.json()) as { successful?: boolean; error?: string }
  if (!execBody.successful) {
    return err(502, 'composio_execute_failed', execBody.error ?? 'unknown')
  }

  return json(200, { ok: true, channel })
}
