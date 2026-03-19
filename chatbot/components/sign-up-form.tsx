'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { OAuthProviderButtons } from '@/components/oauth-provider-buttons';
import { Button } from '@/components/ui/button';
import { getOAuthUrl, resendVerification, signUp, verifyEmail } from '@/lib/auth-actions';

export function SignUpForm({ providers }: { providers: string[] }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    const result = await signUp(email.trim(), password, name.trim());

    if (result.success) {
      if (result.requireVerification) {
        setStep('verify');
        toast.success('Check your email for a verification code.');
      } else {
        window.location.href = '/';
      }
    } else {
      toast.error(result.error);
    }

    setIsLoading(false);
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    const result = await verifyEmail(email.trim(), otp.trim());

    if (result.success) {
      window.location.href = '/';
    } else {
      toast.error(result.error);
    }

    setIsLoading(false);
  }

  async function handleResend() {
    const result = await resendVerification(email.trim());
    if (result.success) {
      toast.success('Verification code resent.');
    } else {
      toast.error(result.error);
    }
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

  if (step === 'verify') {
    return (
      <>
        <div className="text-center">
          <h1 className="font-semibold text-2xl">Verify your email</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleVerify}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="otp">Verification code</label>
            <input
              id="otp"
              type="text"
              required
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-center text-lg tracking-widest placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </div>
          <Button className="w-full" type="submit" disabled={isLoading || otp.length < 6}>
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : 'Verify'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Didn&apos;t receive the code?{' '}
          <button type="button" className="text-foreground underline-offset-4 hover:underline" onClick={handleResend}>
            Resend
          </button>
        </p>
      </>
    );
  }

  return (
    <>
      <div className="text-center">
        <h1 className="font-semibold text-2xl">Create an account</h1>
        <p className="mt-1 text-muted-foreground text-sm">Enter your details to get started</p>
      </div>

      <form className="space-y-4" onSubmit={handleSignUp}>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            required
            autoComplete="name"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
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
          <label className="text-sm font-medium" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button className="w-full" type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : 'Sign up'}
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
