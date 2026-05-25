import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useMembers, type Member, type MemberRole } from './use-members'
import { useUpdateRole } from './use-update-role'
import { useRemoveMember } from './use-remove-member'

type Props = {
  workspaceId: string
  currentUserId: string
  currentUserEmail: string
  currentUserRole: MemberRole | undefined
}

function initialsFor(member: Member, fallbackEmail?: string): string {
  const source = (member.name && member.name.trim()) || fallbackEmail || member.user_id
  const parts = source.split(/[\s@._-]+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
}

function roleBadgeVariant(role: MemberRole): 'default' | 'secondary' | 'outline' {
  if (role === 'owner') return 'default'
  if (role === 'admin') return 'secondary'
  return 'outline'
}

export function MembersTable({ workspaceId, currentUserId, currentUserEmail, currentUserRole }: Props) {
  const { data: members, isLoading } = useMembers(workspaceId)
  const updateRole = useUpdateRole(workspaceId)
  const removeMember = useRemoveMember(workspaceId)

  const [confirm, setConfirm] = useState<{ member: Member; isSelf: boolean } | null>(null)

  const isPrivileged = currentUserRole === 'owner' || currentUserRole === 'admin'

  const onChangeRole = (member: Member, role: MemberRole) => {
    updateRole.mutate(
      { userId: member.user_id, role },
      {
        onSuccess: () => toast.success(`Role updated to ${role}`),
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to update role'),
      },
    )
  }

  const onConfirmRemove = () => {
    if (!confirm) return
    const { member, isSelf } = confirm
    removeMember.mutate(
      { userId: member.user_id },
      {
        onSuccess: () =>
          toast.success(isSelf ? 'You left the workspace' : 'Member removed'),
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to remove member'),
        onSettled: () => setConfirm(null),
      },
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : !members || members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                  No members yet.
                </TableCell>
              </TableRow>
            ) : (
              members.map((m) => {
                const isSelf = m.user_id === currentUserId
                const displayName = m.name?.trim() || (isSelf ? currentUserEmail : 'Member')
                const initials = initialsFor(m, isSelf ? currentUserEmail : undefined)
                const isTargetOwner = m.role === 'owner'

                // Role can be changed by privileged users, but never on the owner.
                const canChangeRole = isPrivileged && !isTargetOwner
                // Remove: privileged users can remove non-owners; self can leave unless owner.
                const canRemoveOther = isPrivileged && !isTargetOwner && !isSelf
                const canLeave = isSelf && !isTargetOwner
                const hasActions = canRemoveOther || canLeave

                return (
                  <TableRow key={m.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {m.avatar_url ? <AvatarImage src={m.avatar_url} alt={displayName} /> : null}
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {displayName}
                            {isSelf ? (
                              <span className="ml-1 text-xs text-muted-foreground">(You)</span>
                            ) : null}
                          </div>
                          {isSelf ? (
                            <div className="truncate text-xs text-muted-foreground">{currentUserEmail}</div>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {canChangeRole ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 px-2">
                              <Badge variant={roleBadgeVariant(m.role)} className="capitalize">
                                {m.role}
                              </Badge>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuLabel>Change role</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled={m.role === 'admin'}
                              onSelect={() => onChangeRole(m, 'admin')}
                            >
                              Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={m.role === 'member'}
                              onSelect={() => onChangeRole(m, 'member')}
                            >
                              Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Badge variant={roleBadgeVariant(m.role)} className="capitalize">
                          {m.role}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(m.joined_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      {hasActions ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Member actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canRemoveOther ? (
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onSelect={() => setConfirm({ member: m, isSelf: false })}
                              >
                                Remove from workspace
                              </DropdownMenuItem>
                            ) : null}
                            {canLeave ? (
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onSelect={() => setConfirm({ member: m, isSelf: true })}
                              >
                                Leave workspace
                              </DropdownMenuItem>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(open) => (open ? null : setConfirm(null))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.isSelf ? 'Leave workspace?' : 'Remove member?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.isSelf
                ? 'You will lose access to this workspace and its data. You can be re-invited later.'
                : `${confirm?.member.name?.trim() || 'This member'} will lose access to the workspace immediately.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMember.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={removeMember.isPending}
              onClick={(e) => {
                e.preventDefault()
                onConfirmRemove()
              }}
            >
              {removeMember.isPending
                ? 'Working…'
                : confirm?.isSelf
                  ? 'Leave'
                  : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
