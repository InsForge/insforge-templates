import { TutorialStep } from "@/components/tutorial/tutorial-step";

export function ConnectInsforgeSteps() {
  return (
    <ol className="flex flex-col gap-6">
      <TutorialStep title="Create an InsForge project">
        <p>
          Create a project in the InsForge dashboard, then copy your project URL and anon key
          into this app&apos;s environment variables.
        </p>
      </TutorialStep>

      <TutorialStep title="Add your environment variables">
        <p>
          Rename <code className="font-mono text-xs bg-[var(--surface)] px-1.5 py-0.5 rounded">.env.example</code> to{" "}
          <code className="font-mono text-xs bg-[var(--surface)] px-1.5 py-0.5 rounded">.env.local</code>, then
          set the following values:
        </p>
        <ul className="space-y-2 font-mono text-xs text-[var(--muted-foreground)]">
          <li>NEXT_PUBLIC_INSFORGE_URL</li>
          <li>NEXT_PUBLIC_INSFORGE_ANON_KEY</li>
          <li>NEXT_PUBLIC_APP_URL <span className="text-[var(--muted-foreground)]/60">(http://localhost:3000 for dev, your actual URL for production)</span></li>
        </ul>
      </TutorialStep>

      <TutorialStep title="Start the app and create your first user">
        <p>
          Once the env vars are in place, open the sign up flow and create your first account.
          After that you can test protected routes and data fetching end to end.
        </p>
      </TutorialStep>
    </ol>
  );
}
