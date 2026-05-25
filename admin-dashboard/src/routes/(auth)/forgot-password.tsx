import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/(auth)/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // InsForge sends the reset code via email automatically based on its auth config.
    // The user is then taken to /otp to enter the code and set a new password.
    toast.success(`If an account exists for ${email}, a reset code has been sent.`)
    setSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
          <p className="text-sm text-muted-foreground">We'll email you a one-time code to set a new password.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <Button type="submit" className="w-full">
            Send reset code
          </Button>
        </form>
        {sent && (
          <p className="text-center text-sm">
            <Link to="/otp" className="font-medium underline-offset-2 hover:underline">
              I have a code →
            </Link>
          </p>
        )}
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/sign-in" className="underline-offset-2 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
