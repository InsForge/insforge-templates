import Link from 'next/link';
import { SignUpForm } from '@/components/sign-up-form';
import { getAuthConfig } from '@/lib/auth-actions';

export default async function SignUpPage() {
  const config = await getAuthConfig();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <SignUpForm providers={config.oAuthProviders ?? []} />

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/sign-in" className="text-foreground underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
