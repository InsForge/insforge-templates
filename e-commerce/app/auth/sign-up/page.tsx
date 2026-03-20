import Link from 'next/link';
import { AuthShell } from '@/components/auth-shell';
import { SignUpForm } from '@/components/sign-up-form';
import { getAuthConfig } from '@/lib/auth-actions';

export const dynamic = 'force-dynamic';

export default async function SignUpPage() {
  const config = await getAuthConfig();

  return (
    <AuthShell
      eyebrow="Create account"
      title="Start shopping"
      description="Email/password, verification codes, and OAuth all map directly into the InsForge-backed customer profile."
    >
      <SignUpForm
        providers={config.oAuthProviders ?? []}
        verifyEmailMethod={config.verifyEmailMethod}
      />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/auth/sign-in" className="text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
