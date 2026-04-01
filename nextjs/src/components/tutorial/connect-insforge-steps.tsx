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
        <p>Set the following values before testing auth or database reads:</p>
        <ul className="space-y-2 font-mono text-xs text-stone-700">
          <li>NEXT_PUBLIC_INSFORGE_URL</li>
          <li>NEXT_PUBLIC_INSFORGE_ANON_KEY</li>
          <li>NEXT_PUBLIC_APP_URL</li>
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
