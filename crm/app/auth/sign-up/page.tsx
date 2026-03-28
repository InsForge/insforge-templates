import Link from 'next/link';
import { AuthShowcase } from '@/components/auth-showcase';
import { Card, CardContent } from '@/components/ui/card';
import { SignUpForm } from '@/components/sign-up-form';
import { getAuthConfig } from '@/lib/auth-actions';

export default async function SignUpPage() {
  const config = await getAuthConfig();

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto grid min-h-dvh max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[0.98fr_0.9fr] lg:px-6">
        <section className="hidden lg:flex min-h-[620px] items-center">
          <AuthShowcase
            title="Build your CRM faster than ever"
            description="Launch your CRM in record time with a ready-to-use template for leads, clients, projects, and pipeline management. Packed with modern foundations and essential backend integrations."
          />
        </section>

        <section className="flex items-center justify-center">
          <Card className="w-full max-w-sm shadow-none">
            <CardContent className="space-y-6 p-6">
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
            </CardContent>
          </Card>
        </section>
      </div>
      <div className="px-4 pb-6 lg:hidden">
        <AuthShowcase
          title="Build your CRM faster than ever"
          description="Launch your CRM in record time with a ready-to-use template for leads, clients, projects, and pipeline management."
        />
      </div>
    </div>
  );
}
