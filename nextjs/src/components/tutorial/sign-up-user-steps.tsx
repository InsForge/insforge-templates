import Link from "next/link";

import { TutorialStep } from "@/components/tutorial/tutorial-step";

const isVercelDeployment =
  process.env.VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "production";

export function SignUpUserSteps() {
  return (
    <ol className="flex flex-col gap-6">
      {isVercelDeployment ? (
        <TutorialStep title="Set up redirect URLs">
          <p>It looks like this starter is running on Vercel.</p>
          <p>
            If you enable email links or OAuth, configure the redirect URLs in your InsForge
            auth settings to match localhost, production, and preview deployments.
          </p>
          <ul className="space-y-2">
            <li>
              <span className="rounded bg-[var(--surface-muted)] px-1.5 py-1 font-mono text-xs text-[var(--muted-foreground)]">
                http://localhost:3000/**
              </span>
            </li>
            <li>
              <span className="rounded bg-[var(--surface-muted)] px-1.5 py-1 font-mono text-xs text-[var(--muted-foreground)]">
                {`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL}/**`}
              </span>
            </li>
          </ul>
        </TutorialStep>
      ) : null}

      <TutorialStep title="Sign up your first user">
        <p>
          Head over to the{" "}
          <Link href="/auth/sign-up" className="font-bold text-[var(--foreground)] hover:underline">
            sign up
          </Link>{" "}
          page and create your first user. When the flow succeeds, the app will send you to
          the protected example page.
        </p>
      </TutorialStep>
    </ol>
  );
}
