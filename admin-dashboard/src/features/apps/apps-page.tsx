import { useState } from 'react'
import { useActiveWorkspace } from '@/features/dashboard/use-active-workspace'
import { useApps } from './use-apps'
import { useToggleApp } from './use-toggle-app'
import { AppsGrid } from './apps-grid'

export function AppsPage() {
  const { workspace } = useActiveWorkspace()
  const { data: apps = [], isLoading } = useApps(workspace?.id)
  const toggle = useToggleApp(workspace?.id)
  const [pendingSlugs, setPendingSlugs] = useState<Set<string>>(new Set())

  const handleToggle = (slug: string, next: boolean) => {
    setPendingSlugs((prev) => {
      const s = new Set(prev)
      s.add(slug)
      return s
    })
    toggle.mutate(
      { slug, connected: next },
      {
        onSettled: () => {
          setPendingSlugs((prev) => {
            const s = new Set(prev)
            s.delete(slug)
            return s
          })
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Apps</h2>
        <p className="text-sm text-muted-foreground">
          Connect integrations to extend {workspace?.name ?? 'your workspace'}.
        </p>
      </div>
      <AppsGrid
        apps={apps}
        isLoading={isLoading}
        isPending={(slug) => pendingSlugs.has(slug)}
        onToggle={handleToggle}
      />
    </div>
  )
}
