'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';

// Two-stage flow:
//   1. /auth/reset-password (no token) — request stage. User enters email,
//      BA sends a link to /auth/reset-password?token=<...>
//   2. /auth/reset-password?token=<...> — completion stage. User enters
//      a new password; authClient.resetPassword finalizes.
export function ResetPasswordForm({ token }: { token: string | null }) {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [linkSent, setLinkSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSendLink(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    const origin =
      process.env.NEXT_PUBLIC_BETTER_AUTH_URL ??
      (typeof window === 'undefined' ? '' : window.location.origin);

    const { error } = await authClient.requestPasswordReset({
      email: email.trim(),
      redirectTo: `${origin}/auth/reset-password`,
    });

    if (error) {
      toast.error(error.message ?? 'Failed to send reset email');
      setIsLoading(false);
      return;
    }

    setLinkSent(true);
    setIsLoading(false);
    toast.success('Check your email for a reset link.');
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setIsLoading(true);

    const { error } = await authClient.resetPassword({
      newPassword,
      token,
    });

    if (error) {
      toast.error(error.message ?? 'Password reset failed');
      setIsLoading(false);
      return;
    }

    toast.success('Password reset. Please sign in.');
    window.location.href = '/auth/sign-in';
  }

  if (token) {
    return (
      <form className="space-y-4" onSubmit={handleSetPassword}>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="newPassword">New password</label>
          <input
            id="newPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Enter new password (8+ characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <Button className="w-full" type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : 'Reset password'}
        </Button>
      </form>
    );
  }

  if (linkSent) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          We sent a reset link to <span className="font-medium text-foreground">{email}</span>.
          Open it on this device to choose a new password.
        </p>
        <Button
          className="w-full"
          type="button"
          onClick={() => (window.location.href = '/auth/sign-in')}
        >
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSendLink}>
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
        {isLoading ? <Loader2 className="size-4 animate-spin" /> : 'Send reset link'}
      </Button>
    </form>
  );
}
