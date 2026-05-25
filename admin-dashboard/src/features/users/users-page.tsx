import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { useActiveWorkspace } from '@/features/dashboard/use-active-workspace'
import { MembersTable } from './members-table'
import { InviteDialog } from './invite-dialog'
import { PendingInvitationsList } from './pending-invitations-list'

export function UsersPage() {
  const { user } = useAuth()
  const { workspace, isLoading } = useActiveWorkspace()
  const [inviteOpen, setInviteOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Users</h2>
          <p className="text-sm text-muted-foreground">Loading workspace…</p>
        </div>
      </div>
    )
  }

  if (!workspace || !user) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Users</h2>
          <p className="text-sm text-muted-foreground">
            No active workspace. Create or join a workspace to manage members.
          </p>
        </div>
      </div>
    )
  }

  const canManage = workspace.role === 'owner' || workspace.role === 'admin'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Users</h2>
          <p className="text-sm text-muted-foreground">
            Manage members and invitations for {workspace.name}.
          </p>
        </div>
        {canManage ? (
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite member
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            People with access to this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MembersTable
            workspaceId={workspace.id}
            currentUserId={user.id}
            currentUserEmail={user.email}
            currentUserRole={workspace.role}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending invitations</CardTitle>
          <CardDescription>
            {canManage
              ? 'Outstanding invitations that have not been accepted yet.'
              : 'Only admins and owners can manage invitations.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PendingInvitationsList workspaceId={workspace.id} canManage={canManage} />
        </CardContent>
      </Card>

      {canManage ? (
        <InviteDialog
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          workspaceId={workspace.id}
          userId={user.id}
          workspaceName={workspace.name}
        />
      ) : null}
    </div>
  )
}
