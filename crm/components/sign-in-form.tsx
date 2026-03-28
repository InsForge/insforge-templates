'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { OAuthProviderButtons } from '@/components/oauth-provider-buttons';
import { Button } from '@/components/ui/button';
import { getOAuthUrl, signIn } from '@/lib/auth-actions';
import { DEFAULT_LANDING_ROUTE } from '@/lib/constants';

export function SignInForm({ providers }: { providers: string[] }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    const result = await signIn(email.trim(), password);

    if (result.success) {
      window.location.href = DEFAULT_LANDING_ROUTE;
      return;
    } else {
      toast.error(result.error);
    }

    setIsLoading(false);
  }

  async function handleOAuth(provider: string) {
    setOauthLoading(provider);
    const result = await getOAuthUrl(provider);

    if ('error' in result) {
      toast.error(result.error);
      setOauthLoading(null);
    } else {
      window.location.href = result.url;
    }
  }

  return (
    <>
      <form className="space-y-4" onSubmit={handleSubmit}>
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
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium" htmlFor="password">Password</label>
            <a href="/auth/reset-password" className="text-xs text-muted-foreground hover:text-foreground">
              Forgot password?
            </a>
          </div>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button className="w-full" type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : 'Sign in'}
        </Button>
      </form>

      <OAuthProviderButtons
        providers={providers}
        loadingProvider={oauthLoading}
        onSelect={handleOAuth}
      />
    </>
  );
}
