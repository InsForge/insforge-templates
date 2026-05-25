import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { insforge } from '@/lib/insforge'
import { useAuth } from '@/lib/auth-context'
import { ensureWorkspace } from '@/features/auth/ensure-workspace'
import { useWorkspaceStore } from '@/features/workspaces/workspace-store'
import { Github } from 'lucide-react'

export const Route = createFileRoute('/(auth)/sign-in')({
  component: SignInPage,
})

function SignInPage() {
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const setActiveWorkspaceId = useWorkspaceStore((s) => s.setActiveWorkspaceId)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data, error } = await insforge.auth.signInWithPassword({ email, password })
      if (error || !data?.user) {
        toast.error(error?.message ?? 'Sign in failed')
        return
      }
      const user = data.user as { id: string; email: string }
      const wsId = await ensureWorkspace(user.id, user.email)
      setActiveWorkspaceId(wsId)
      await refresh()
      navigate({ to: '/dashboard' })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  const onOAuth = async (provider: 'google' | 'github') => {
    const { data, error } = await insforge.auth.signInWithOAuth({
      provider,
      redirectTo: `${window.location.origin}/auth/callback`,
      skipBrowserRedirect: true,
    })
    if (error || !data?.url) {
      toast.error(error?.message ?? `${provider} sign-in is not configured`)
      return
    }
    if (data.codeVerifier) {
      sessionStorage.setItem('insforge.pkce_verifier', data.codeVerifier)
    }
    window.location.href = data.url
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to your workspace</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link to="/forgot-password" className="text-xs text-muted-foreground underline-offset-2 hover:underline">
                Forgot?
              </Link>
            </div>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" type="button" onClick={() => onOAuth('google')}>
            Google
          </Button>
          <Button variant="outline" type="button" onClick={() => onOAuth('github')}>
            <Github className="mr-2 h-4 w-4" /> GitHub
          </Button>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/sign-up" className="font-medium text-foreground underline-offset-2 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
