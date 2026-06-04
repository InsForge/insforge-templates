import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { SignUpForm } from '@/components/sign-up-form';
import { getAuthConfig } from '@/lib/auth-actions';

export default async function SignUpPage() {
  const config = await getAuthConfig();
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm shadow-none">
        <CardContent className="space-y-6 p-6">
          <div className="text-center">
            <h1 className="font-semibold text-2xl">Create your workspace</h1>
            <p className="mt-1 text-muted-foreground text-sm">Start in seconds. No credit card required.</p>
          </div>
          <SignUpForm
            providers={config.oAuthProviders ?? []}
            passwordMinLength={config.passwordMinLength ?? 8}
            verifyEmailMethod={config.verifyEmailMethod}
          />
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/sign-in" className="text-foreground underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
