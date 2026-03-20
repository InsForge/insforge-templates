import Link from 'next/link';
import { AuthShell } from '@/components/auth-shell';
import { SignInForm } from '@/components/sign-in-form';
import { getAuthConfig } from '@/lib/auth-actions';

export const dynamic = 'force-dynamic';

export default async function SignInPage() {
  const config = await getAuthConfig();

  return (
    <AuthShell
      eyebrow="Sign in"
      title="Welcome back"
      description="Your cart, addresses, and orders will be waiting for you."
    >
      <SignInForm providers={config.oAuthProviders ?? []} />

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/auth/sign-up" className="text-foreground underline-offset-4 hover:underline">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}
