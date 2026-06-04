import { ExternalLink, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { AppWithConnection } from './use-apps'

type Props = {
  apps: AppWithConnection[]
  isLoading: boolean
  isConnectPending: (slug: string) => boolean
  isDisconnectPending: (slug: string) => boolean
  onConnect: (app: AppWithConnection) => void
  onDisconnect: (app: AppWithConnection) => void
}

export function AppsGrid({
  apps,
  isLoading,
  isConnectPending,
  isDisconnectPending,
  onConnect,
  onDisconnect,
}: Props) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-2">
              <div className="flex items-start justify-between">
                <Skeleton className="h-10 w-10 rounded-md" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  if (apps.length === 0) {
    return <p className="text-sm text-muted-foreground">No apps available.</p>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {apps.map((app) => {
        const connectPending = isConnectPending(app.slug)
        const disconnectPending = isDisconnectPending(app.slug)
        const isNative = app.integration_kind === 'insforge_native'

        return (
          <Card key={app.slug} className="relative flex flex-col">
            {app.connected && (
              <Badge variant="secondary" className="absolute right-3 top-3">
                Connected
              </Badge>
            )}
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-3">
                {app.icon_url ? (
                  <img
                    src={app.icon_url}
                    alt={`${app.name} icon`}
                    className="h-10 w-10 rounded-md bg-muted p-1.5 dark:bg-white"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-md bg-muted" />
                )}
                <CardTitle className="text-base">{app.name}</CardTitle>
              </div>
              <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                {app.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="mt-auto flex items-center justify-between gap-3 pt-0">
              {isNative ? (
                <>
                  <span className="text-xs text-muted-foreground">
                    Managed in InsForge dashboard
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onConnect(app)}
                    aria-label={`Configure ${app.name} in dashboard`}
                  >
                    Configure
                    <ExternalLink className="ml-1.5 h-3.5 w-3.5" aria-hidden />
                  </Button>
                </>
              ) : app.connected ? (
                <>
                  <span
                    className="truncate text-xs text-muted-foreground"
                    title={app.account_label ?? undefined}
                  >
                    {app.account_label ? `as ${app.account_label}` : 'Active integration'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={disconnectPending}
                    onClick={() => onDisconnect(app)}
                    aria-label={`Disconnect ${app.name}`}
                  >
                    {disconnectPending ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
                        Disconnecting…
                      </>
                    ) : (
                      'Disconnect'
                    )}
                  </Button>
                </>
              ) : !app.is_available ? (
                <>
                  <span className="text-xs text-muted-foreground">Coming soon</span>
                  <Button
                    size="sm"
                    disabled
                    aria-label={`${app.name} coming soon`}
                  >
                    Connect
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-xs text-muted-foreground">Not connected</span>
                  <Button
                    size="sm"
                    disabled={connectPending}
                    onClick={() => onConnect(app)}
                    aria-label={`Connect ${app.name}`}
                  >
                    {connectPending ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
                        Connecting…
                      </>
                    ) : (
                      'Connect'
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
