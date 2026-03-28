import Link from 'next/link';
import { SignInForm } from '@/components/sign-in-form';
import { getAuthConfig } from '@/lib/auth-actions';

export default async function SignInPage() {
  const config = await getAuthConfig();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="font-semibold text-2xl">Welcome back</h1>
          <p className="mt-1 text-muted-foreground text-sm">Sign in to your account</p>
        </div>

        <SignInForm providers={config.oAuthProviders ?? []} />

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/auth/sign-up" className="text-foreground underline-offset-4 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
