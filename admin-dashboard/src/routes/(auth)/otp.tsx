import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { insforge } from '@/lib/insforge'

export const Route = createFileRoute('/(auth)/otp')({
  component: OtpPage,
})

function OtpPage() {
  const navigate = useNavigate()
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await insforge.auth.resetPassword({ newPassword, otp })
      if (error) {
        toast.error(error.message ?? 'Invalid or expired code')
        return
      }
      toast.success('Password updated. Please sign in.')
      navigate({ to: '/sign-in' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Enter your reset code</h1>
          <p className="text-sm text-muted-foreground">Paste the 6-digit code from your email and pick a new password.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Code</Label>
            <Input id="otp" inputMode="numeric" pattern="[0-9]*" required maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input id="newPassword" type="password" minLength={8} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Updating…' : 'Update password'}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/sign-in" className="underline-offset-2 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
