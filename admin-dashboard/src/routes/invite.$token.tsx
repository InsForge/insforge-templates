import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { CheckCircle2, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { insforge } from '@/lib/insforge'
import { useAuth } from '@/lib/auth-context'
import { useWorkspaceStore } from '@/features/workspaces/workspace-store'

export const Route = createFileRoute('/invite/$token')({
  component: InvitePage,
})

type InvitationRow = {
  id: string
  workspace_id: string
  email: string
  role: 'admin' | 'member'
  token: string
  expires_at: string
  accepted_at: string | null
  created_by: string
  created_at: string
}

type WorkspaceRow = {
  id: string
  name: string
  slug: string
}

type InvitationLookup =
  | { status: 'not_found' }
  | { status: 'expired'; invitation: InvitationRow }
  | { status: 'accepted'; invitation: InvitationRow }
  | { status: 'valid'; invitation: InvitationRow; workspace: WorkspaceRow | null }

function InvitePage() {
  const { token } = Route.useParams()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const setActiveWorkspaceId = useWorkspaceStore((s) => s.setActiveWorkspaceId)
  const [accepted, setAccepted] = useState(false)

  const lookup = useQuery({
    enabled: !!user, // RLS requires auth to read the invitation
    queryKey: ['invitation-lookup', token],
    queryFn: async (): Promise<InvitationLookup> => {
      const { data, error } = await insforge.database
        .from('workspace_invitations')
        .select('id, workspace_id, email, role, token, expires_at, accepted_at, created_by, created_at')
        .eq('token', token)
        .limit(1)
      if (error) throw new Error(error.message)
      const rows = (data ?? []) as InvitationRow[]
      const invitation = rows[0]
      if (!invitation) return { status: 'not_found' }
      if (invitation.accepted_at) return { status: 'accepted', invitation }
      if (new Date(invitation.expires_at).getTime() < Date.now()) {
        return { status: 'expired', invitation }
      }

      // Fetch workspace name for display. RLS only grants this if the user is
      // already a member; for new invitees this will return no row, which is
      // fine — we'll fall back to a generic label.
      const { data: wsData } = await insforge.database
        .from('workspaces')
        .select('id, name, slug')
        .eq('id', invitation.workspace_id)
        .limit(1)
      const workspace = ((wsData ?? []) as WorkspaceRow[])[0] ?? null
      return { status: 'valid', invitation, workspace }
    },
  })

  const accept = useMutation({
    mutationFn: async (invitation: InvitationRow) => {
      if (!user) throw new Error('Not signed in')

      // 1. Insert membership row for the current user with the role from the invitation.
      const { error: memErr } = await insforge.database.from('workspace_members').insert([
        {
          workspace_id: invitation.workspace_id,
          user_id: user.id,
          role: invitation.role,
          invited_by: invitation.created_by,
        },
      ])
      if (memErr) throw new Error(memErr.message)

      // 2. Mark invitation accepted. RLS allows the invitee (email match) to update.
      const { error: invErr } = await insforge.database
        .from('workspace_invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id)
      if (invErr) {
        // Membership succeeded; surface a non-fatal warning.
        // eslint-disable-next-line no-console
        console.warn('Could not mark invitation accepted:', invErr.message)
      }

      return invitation.workspace_id
    },
    onSuccess: (workspaceId) => {
      setActiveWorkspaceId(workspaceId)
      setAccepted(true)
      toast.success('You joined the workspace')
      void qc.invalidateQueries({ queryKey: ['workspaces'] })
      void qc.invalidateQueries({ queryKey: ['workspace-members', workspaceId] })
      // Give the toast a beat, then redirect.
      setTimeout(() => navigate({ to: '/dashboard' }), 600)
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Could not accept invitation')
    },
  })

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        {!user && !authLoading ? (
          <SignInPrompt token={token} />
        ) : authLoading || lookup.isLoading ? (
          <LoadingCard />
        ) : lookup.isError ? (
          <ErrorCard message={lookup.error instanceof Error ? lookup.error.message : 'Failed to load invitation'} />
        ) : lookup.data?.status === 'not_found' ? (
          <NotFoundCard />
        ) : lookup.data?.status === 'expired' ? (
          <ExpiredCard email={lookup.data.invitation.email} />
        ) : lookup.data?.status === 'accepted' ? (
          <AlreadyAcceptedCard />
        ) : lookup.data?.status === 'valid' ? (
          (() => {
            const invitation = lookup.data.invitation
            return (
              <ValidInvitationCard
                workspaceName={lookup.data.workspace?.name ?? 'a workspace'}
                invitedEmail={invitation.email}
                currentEmail={user?.email ?? ''}
                role={invitation.role}
                accepting={accept.isPending}
                accepted={accepted}
                onAccept={() => accept.mutate(invitation)}
              />
            )
          })()
        ) : null}
      </Card>
    </div>
  )
}

function LoadingCard() {
  return (
    <>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </>
  )
}

function SignInPrompt({ token: _token }: { token: string }) {
  return (
    <>
      <CardHeader>
        <CardTitle>You&apos;re invited</CardTitle>
        <CardDescription>
          Sign in or create an account, then re-open this invitation link to accept.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button asChild className="w-full">
          <Link to="/sign-in">Sign in</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link to="/sign-up">Create an account</Link>
        </Button>
      </CardContent>
    </>
  )
}

function NotFoundCard() {
  return (
    <>
      <CardHeader>
        <CardTitle>Invitation not found</CardTitle>
        <CardDescription>
          This invitation link is invalid. Ask the workspace admin to send you a new one.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link to="/dashboard">Go to dashboard</Link>
        </Button>
      </CardFooter>
    </>
  )
}

function ExpiredCard({ email }: { email: string }) {
  return (
    <>
      <CardHeader>
        <div className="mb-2 flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <Mail className="h-5 w-5" />
          <span className="text-sm font-medium">Invitation expired</span>
        </div>
        <CardTitle>This link is no longer valid</CardTitle>
        <CardDescription>
          The invitation sent to {email} has expired. Ask the workspace admin to resend one.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link to="/dashboard">Go to dashboard</Link>
        </Button>
      </CardFooter>
    </>
  )
}

function AlreadyAcceptedCard() {
  return (
    <>
      <CardHeader>
        <div className="mb-2 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-medium">Already accepted</span>
        </div>
        <CardTitle>You&apos;ve already joined</CardTitle>
        <CardDescription>
          This invitation has already been used. Head to your dashboard.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button asChild className="w-full">
          <Link to="/dashboard">Go to dashboard</Link>
        </Button>
      </CardFooter>
    </>
  )
}

function ErrorCard({ message }: { message: string }) {
  return (
    <>
      <CardHeader>
        <CardTitle>Couldn&apos;t load invitation</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link to="/dashboard">Go to dashboard</Link>
        </Button>
      </CardFooter>
    </>
  )
}

function ValidInvitationCard({
  workspaceName,
  invitedEmail,
  currentEmail,
  role,
  accepting,
  accepted,
  onAccept,
}: {
  workspaceName: string
  invitedEmail: string
  currentEmail: string
  role: 'admin' | 'member'
  accepting: boolean
  accepted: boolean
  onAccept: () => void
}) {
  const emailMismatch =
    currentEmail.trim().toLowerCase() !== invitedEmail.trim().toLowerCase()

  return (
    <>
      <CardHeader>
        <CardTitle>Join {workspaceName}</CardTitle>
        <CardDescription>
          You&apos;ve been invited as <span className="font-medium capitalize">{role}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-md border bg-muted/50 p-3 text-sm">
          <div className="text-xs text-muted-foreground">Invitation for</div>
          <div className="font-medium">{invitedEmail}</div>
        </div>
        {emailMismatch ? (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            You&apos;re signed in as <span className="font-medium">{currentEmail}</span>. This invitation
            was sent to a different address; you may not be able to accept it.
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button asChild variant="outline" className="flex-1">
          <Link to="/dashboard">Decline</Link>
        </Button>
        <Button className="flex-1" onClick={onAccept} disabled={accepting || accepted}>
          {accepted ? 'Joined!' : accepting ? 'Joining…' : 'Accept invitation'}
        </Button>
      </CardFooter>
    </>
  )
}
