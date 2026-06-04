import Link from 'next/link';
import { AuthShell } from '@/components/auth-shell';
import { SignUpForm } from '@/components/sign-up-form';

export const dynamic = 'force-dynamic';

export default function SignUpPage() {
  return (
    <AuthShell
      eyebrow="Create account"
      title="Get started"
      description="One account uploads documents and chats with them."
    >
      <SignUpForm />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/auth/sign-in" className="text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
