import { ConnectInsforgeSteps } from "@/components/tutorial/connect-insforge-steps";
import { Hero } from "@/components/hero";
import { SignUpUserSteps } from "@/components/tutorial/sign-up-user-steps";
import { SiteShell } from "@/components/site-shell";
import { hasEnvVars } from "@/lib/utils";

export default async function Home() {
  return (
    <SiteShell>
      <div className="flex flex-col gap-20">
        <Hero />
        <section className="flex flex-col gap-6 px-4">
          <h2 className="mb-2 text-xl font-medium text-stone-950">Next steps</h2>
          {hasEnvVars ? <SignUpUserSteps /> : <ConnectInsforgeSteps />}
        </section>
      </div>
    </SiteShell>
  );
}
