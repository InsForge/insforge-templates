'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { exchangeResetCode, resetPassword, sendResetEmail } from '@/lib/auth-actions';

export function ResetPasswordForm() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [token, setToken] = useState('');
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    const result = await sendResetEmail(email.trim());

    if (result.success) {
      setStep('code');
      toast.success('Check your email for a reset code.');
    } else {
      toast.error(result.error);
    }

    setIsLoading(false);
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    const result = await exchangeResetCode(email.trim(), code.trim());

    if (result.success) {
      setToken(result.token);
      setStep('password');
    } else {
      toast.error(result.error);
    }

    setIsLoading(false);
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    const result = await resetPassword(newPassword, token);

    if (result.success) {
      toast.success('Password reset successfully. Please sign in.');
      window.location.href = '/auth/sign-in';
    } else {
      toast.error(result.error);
    }

    setIsLoading(false);
  }

  return (
    <>
      {step === 'email' && (
        <>
          <div className="text-center">
            <h1 className="font-semibold text-2xl">Reset password</h1>
            <p className="mt-1 text-muted-foreground text-sm">
              Enter your email and we&apos;ll send you a reset code
            </p>
          </div>
          <form className="space-y-4" onSubmit={handleSendEmail}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : 'Send reset code'}
            </Button>
          </form>
        </>
      )}

      {step === 'code' && (
        <>
          <div className="text-center">
            <h1 className="font-semibold text-2xl">Enter reset code</h1>
            <p className="mt-1 text-muted-foreground text-sm">
              We sent a code to <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>
          <form className="space-y-4" onSubmit={handleVerifyCode}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="code">Reset code</label>
              <input
                id="code"
                type="text"
                required
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-center text-lg tracking-widest placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </div>
            <Button className="w-full" type="submit" disabled={isLoading || code.length < 6}>
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : 'Verify code'}
            </Button>
          </form>
        </>
      )}

      {step === 'password' && (
        <>
          <div className="text-center">
            <h1 className="font-semibold text-2xl">Set new password</h1>
            <p className="mt-1 text-muted-foreground text-sm">Choose a new password for your account</p>
          </div>
          <form className="space-y-4" onSubmit={handleResetPassword}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="newPassword">New password</label>
              <input
                id="newPassword"
                type="password"
                required
                autoComplete="new-password"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : 'Reset password'}
            </Button>
          </form>
        </>
      )}
    </>
  );
}
