import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Copy, Check, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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
import { useInvitations, useDeleteInvitation, type Invitation } from './use-invitations'

type Props = {
  workspaceId: string
  canManage: boolean
}

export function PendingInvitationsList({ workspaceId, canManage }: Props) {
  const { data: invitations, isLoading } = useInvitations(workspaceId)
  const deleteInvitation = useDeleteInvitation(workspaceId)
  const [confirm, setConfirm] = useState<Invitation | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const onCopy = async (inv: Invitation) => {
    const link = `${window.location.origin}/invite/${inv.token}`
    try {
      await navigator.clipboard.writeText(link)
      setCopiedId(inv.id)
      toast.success('Invitation link copied')
      setTimeout(() => setCopiedId((id) => (id === inv.id ? null : id)), 2000)
    } catch {
      toast.error('Unable to copy link')
    }
  }

  const onConfirmRevoke = () => {
    if (!confirm) return
    deleteInvitation.mutate(confirm.id, {
      onSuccess: () => toast.success('Invitation revoked'),
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : 'Failed to revoke invitation'),
      onSettled: () => setConfirm(null),
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }, (_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    )
  }

  if (!invitations || invitations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No pending invitations.</p>
    )
  }

  return (
    <>
      <ul className="divide-y rounded-md border">
        {invitations.map((inv) => (
          <li key={inv.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium">{inv.email}</span>
                <Badge variant="outline" className="capitalize">
                  {inv.role}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Sent {formatDistanceToNow(new Date(inv.created_at), { addSuffix: true })}
                {' · '}
                Expires {formatDistanceToNow(new Date(inv.expires_at), { addSuffix: true })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onCopy(inv)}
              >
                {copiedId === inv.id ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                Copy link
              </Button>
              {canManage ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setConfirm(inv)}
                  aria-label="Revoke invitation"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <AlertDialog open={!!confirm} onOpenChange={(open) => (open ? null : setConfirm(null))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              The invitation link for {confirm?.email} will stop working immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteInvitation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteInvitation.isPending}
              onClick={(e) => {
                e.preventDefault()
                onConfirmRevoke()
              }}
            >
              {deleteInvitation.isPending ? 'Revoking…' : 'Revoke'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
