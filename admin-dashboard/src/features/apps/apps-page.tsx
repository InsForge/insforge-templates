import { useMemo } from 'react'
import { AlertTriangle, Info } from 'lucide-react'
import { useActiveWorkspace } from '@/features/dashboard/use-active-workspace'
import { useApps } from './use-apps'
import { useAppsConfig } from './use-apps-config'
import { useConnectApp } from './use-connect-app'
import { useDisconnectApp } from './use-disconnect-app'
import { AppsGrid } from './apps-grid'

const COMPOSIO_SETUP_URL =
  'https://github.com/InsForge/insforge-templates/tree/main/admin-dashboard#connecting-third-party-apps'

export function AppsPage() {
  const { workspace } = useActiveWorkspace()
  const { data: apps = [], isLoading } = useApps(workspace?.id)
  const { data: appsConfig, isLoading: isConfigLoading, isError: isConfigError, refetch: refetchConfig } = useAppsConfig()
  const connect = useConnectApp(workspace?.id)
  const disconnect = useDisconnectApp(workspace?.id)

  const enrichedApps = useMemo(() => {
    const toolkits = new Set(appsConfig?.configured_toolkits ?? [])
    return apps.map((app) => {
      const slug = app.composio_toolkit_slug
      const available = !!appsConfig?.composio_enabled && !!slug && toolkits.has(slug)
      return { ...app, is_available: available }
    })
  }, [apps, appsConfig])

  const showSetupBanner =
    !isConfigLoading && !isConfigError && apps.length > 0 && !appsConfig?.composio_enabled

  const isConnectPending = (slug: string) =>
    connect.isPending && connect.variables?.app.slug === slug
  const isDisconnectPending = (slug: string) =>
    disconnect.isPending && disconnect.variables?.app.slug === slug

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Apps</h2>
        <p className="text-sm text-muted-foreground">
          Connect integrations to extend {workspace?.name ?? 'your workspace'}.
        </p>
      </div>
      {isConfigError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
          <div className="flex-1">
            <p className="font-medium">Couldn't load app integration status</p>
            <p className="text-muted-foreground">
              Connect/disconnect actions may not work until this resolves.
            </p>
            <button
              type="button"
              onClick={() => void refetchConfig()}
              className="mt-1 inline-block font-medium underline-offset-4 hover:underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      {showSetupBanner && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-md border border-border bg-muted/40 px-4 py-3 text-sm"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <div className="flex-1">
            <p className="font-medium">Third-party integrations need Composio</p>
            <p className="text-muted-foreground">
              Provision Composio secrets on this project to enable GitHub, Slack, Notion,
              and the other OAuth apps.
            </p>
            <a
              href={COMPOSIO_SETUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block font-medium underline-offset-4 hover:underline"
            >
              View setup guide →
            </a>
          </div>
        </div>
      )}
      <AppsGrid
        apps={enrichedApps}
        isLoading={isLoading || isConfigLoading}
        isConnectPending={isConnectPending}
        isDisconnectPending={isDisconnectPending}
        onConnect={(app) => connect.mutate({ app })}
        onDisconnect={(app) => disconnect.mutate({ app })}
      />
    </div>
  )
}
