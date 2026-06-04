import Link from 'next/link';
import { AuthShell } from '@/components/auth-shell';
import { SignInForm } from '@/components/sign-in-form';

export const dynamic = 'force-dynamic';

export default function SignInPage() {
  return (
    <AuthShell
      eyebrow="Sign in"
      title="Welcome back"
      description="Your documents and chats will be waiting for you."
    >
      <SignInForm />

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/auth/sign-up" className="text-foreground underline-offset-4 hover:underline">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}
