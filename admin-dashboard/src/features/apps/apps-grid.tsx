import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { AppWithConnection } from './use-apps'

type Props = {
  apps: AppWithConnection[]
  isLoading: boolean
  isPending: (slug: string) => boolean
  onToggle: (slug: string, next: boolean) => void
}

export function AppsGrid({ apps, isLoading, isPending, onToggle }: Props) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-2">
              <div className="flex items-start justify-between">
                <Skeleton className="h-10 w-10 rounded-md" />
                <Skeleton className="h-6 w-10 rounded-full" />
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
      {apps.map((app) => (
        <Card key={app.slug} className="relative">
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
          <CardContent className="flex items-center justify-between pt-0">
            <span className="text-xs text-muted-foreground">
              {app.connected ? 'Active integration' : 'Not connected'}
            </span>
            <Switch
              checked={app.connected}
              disabled={isPending(app.slug)}
              onCheckedChange={(next) => onToggle(app.slug, next)}
              aria-label={`Toggle ${app.name}`}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
