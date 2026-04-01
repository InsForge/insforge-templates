import { Suspense } from "react";
import Link from "next/link";

import { AuthButton } from "@/components/auth-button";
import { DeployButton } from "@/components/deploy-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { hasEnvVars } from "@/lib/utils";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="h-16 w-full border-b border-stone-900/10">
          <div className="mx-auto flex h-full w-full max-w-5xl items-center justify-between px-5 text-sm">
            <div className="flex items-center gap-5 font-semibold text-stone-950">
              <Link href="/">Next.js InsForge Starter</Link>
              <DeployButton />
            </div>
            {hasEnvVars ? (
              <Suspense>
                <AuthButton />
              </Suspense>
            ) : (
              <EnvVarWarning />
            )}
          </div>
        </nav>

        <div className="flex-1 w-full max-w-5xl p-5">{children}</div>

        <footer className="mx-auto flex w-full items-center justify-center gap-8 border-t py-16 text-center text-xs">
          <p>
            Powered by{" "}
            <a href="https://insforge.dev" target="_blank" rel="noreferrer" className="font-bold hover:underline">
              InsForge
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
