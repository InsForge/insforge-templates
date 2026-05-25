import { useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useWorkspaces } from '@/features/workspaces/use-workspaces'
import { useWorkspaceStore } from '@/features/workspaces/workspace-store'

/**
 * Hook used by authenticated pages to resolve the active workspace.
 * Falls back to the first membership if the store hasn't been hydrated yet.
 */
export function useActiveWorkspace() {
  const { user } = useAuth()
  const { data: workspaces = [], isLoading } = useWorkspaces(user?.id)
  const activeId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const setActiveId = useWorkspaceStore((s) => s.setActiveWorkspaceId)

  useEffect(() => {
    if (!activeId && workspaces.length > 0) setActiveId(workspaces[0]!.id)
  }, [activeId, workspaces, setActiveId])

  const active = workspaces.find((w) => w.id === activeId) ?? workspaces[0]
  return { workspace: active, isLoading, allWorkspaces: workspaces }
}
