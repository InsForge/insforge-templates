import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { insforge } from '@/lib/insforge'
import { useAuth } from '@/lib/auth-context'
import { ensureWorkspace } from '@/features/auth/ensure-workspace'
import { useWorkspaceStore } from '@/features/workspaces/workspace-store'

const VERIFIER_KEY = 'insforge.pkce_verifier'

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
      // Read directly from window.location so the SDK's exact param names work
      // regardless of how TanStack Router parses search.
      const params = new URLSearchParams(window.location.search)
      const code = params.get('insforge_code') ?? params.get('code')
      const err = params.get('error')
      const errDesc = params.get('error_description')

      if (err) {
        toast.error(errDesc ?? err)
        sessionStorage.removeItem(VERIFIER_KEY)
        navigate({ to: '/sign-in' })
        return
      }

      if (!code) {
        toast.error('Missing authorization code')
        navigate({ to: '/sign-in' })
        return
      }

      const codeVerifier = sessionStorage.getItem(VERIFIER_KEY) ?? undefined
      sessionStorage.removeItem(VERIFIER_KEY)

      const { data, error } = await insforge.auth.exchangeOAuthCode(code, codeVerifier)
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
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not initialize workspace')
      }
      await refresh()
      navigate({ to: '/dashboard' })
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
