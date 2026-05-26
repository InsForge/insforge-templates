import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { insforge } from '@/lib/insforge'
import { useAuth } from '@/lib/auth-context'
import { ensureWorkspace } from '@/features/auth/ensure-workspace'
import { useWorkspaceStore } from '@/features/workspaces/workspace-store'

export const Route = createFileRoute('/auth/callback')({
  component: OAuthCallbackPage,
})

function OAuthCallbackPage() {
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const setActiveWorkspaceId = useWorkspaceStore((s) => s.setActiveWorkspaceId)
  const ran = useRef(false)
  const [status, setStatus] = useState<string>('Completing sign-in…')

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    void (async () => {
      const params = new URLSearchParams(window.location.search)
      const err = params.get('error')
      if (err) {
        toast.error(params.get('error_description') ?? err)
        navigate({ to: '/sign-in' })
        return
      }

      // The SDK auto-detects `insforge_code` on init and exchanges it; getCurrentUser
      // waits for that pending exchange to settle before returning.
      const { data, error } = await insforge.auth.getCurrentUser()
      if (error || !data?.user) {
        toast.error(error?.message ?? 'Sign-in failed')
        navigate({ to: '/sign-in' })
        return
      }

      const user = data.user as { id: string; email: string }
      setStatus('Setting up your workspace…')
      try {
        const wsId = await ensureWorkspace(user.id, user.email)
        setActiveWorkspaceId(wsId)
        await refresh()
        navigate({ to: '/dashboard' })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Could not initialize workspace'
        console.error('ensureWorkspace failed:', err)
        toast.error(`Workspace setup failed: ${msg}`, { duration: 10000 })
        await refresh()
        navigate({ to: '/dashboard' })
      }
    })()
  }, [navigate, refresh, setActiveWorkspaceId])

  return (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div className="space-y-2">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        <p className="text-sm text-muted-foreground">{status}</p>
      </div>
    </div>
  )
}
