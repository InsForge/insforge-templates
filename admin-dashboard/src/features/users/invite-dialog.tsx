import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useInviteMember, type InvitationRole } from './use-invitations'

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  role: z.enum(['admin', 'member']),
})

type InviteForm = z.infer<typeof inviteSchema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  userId: string
  workspaceName: string
}

export function InviteDialog({ open, onOpenChange, workspaceId, userId, workspaceName }: Props) {
  const [createdToken, setCreatedToken] = useState<string | null>(null)
  const [createdEmail, setCreatedEmail] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const invite = useInviteMember(workspaceId, userId)

  const form = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'member' },
  })

  const reset = () => {
    form.reset({ email: '', role: 'member' })
    setCreatedToken(null)
    setCreatedEmail(null)
    setCopied(false)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const onSubmit = (values: InviteForm) => {
    invite.mutate(
      { email: values.email, role: values.role as InvitationRole },
      {
        onSuccess: (inv) => {
          setCreatedToken(inv.token)
          setCreatedEmail(inv.email)
          toast.success('Invitation created')
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : 'Failed to create invitation'),
      },
    )
  }

  const inviteLink =
    createdToken && typeof window !== 'undefined'
      ? `${window.location.origin}/invite/${createdToken}`
      : ''

  const onCopy = async () => {
    if (!inviteLink) return
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      toast.success('Invitation link copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Unable to copy. Select and copy the link manually.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        {createdToken ? (
          <>
            <DialogHeader>
              <DialogTitle>Invitation ready</DialogTitle>
              <DialogDescription>
                Share this link with {createdEmail} to join {workspaceName}. The link expires in 7 days.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <FormLabel>Invitation link</FormLabel>
              <div className="flex items-center gap-2">
                <Input readOnly value={inviteLink} onFocus={(e) => e.currentTarget.select()} />
                <Button type="button" variant="outline" size="icon" onClick={onCopy} aria-label="Copy invitation link">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={reset}>
                Invite another
              </Button>
              <Button type="button" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Invite a teammate</DialogTitle>
                <DialogDescription>
                  Send an invitation to join {workspaceName}. We&apos;ll generate a shareable link.
                </DialogDescription>
              </DialogHeader>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="off"
                        placeholder="teammate@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="member">Member — can view and collaborate</SelectItem>
                        <SelectItem value="admin">Admin — can manage members and invitations</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={invite.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={invite.isPending}>
                  {invite.isPending ? 'Creating…' : 'Create invitation'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
