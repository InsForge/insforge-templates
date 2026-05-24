'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OAuthButton } from '@/components/oauth-button';
import { signUp } from '@/lib/auth-actions';

export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await signUp(email.trim(), password);
    if (result.success) {
      toast.success('Account created.');
      window.location.href = '/dashboard';
      return;
    }
    toast.error(result.error);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : 'Create account'}
        </Button>
      </form>
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <OAuthButton provider="google" label="Continue with Google" />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/sign-in" className="underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
