import { redirect } from "next/navigation";

import { FetchDataSteps } from "@/components/tutorial/fetch-data-steps";
import { getCurrentUserDetails, getCurrentViewer } from "@/lib/auth-state";
import { hasEnvVars } from "@/lib/utils";

export default async function ProtectedPage() {
  if (!hasEnvVars) {
    redirect("/");
  }

  const viewer = await getCurrentViewer();

  if (!viewer.isAuthenticated) {
    redirect("/auth/sign-in");
  }

  const user = await getCurrentUserDetails();

  return (
    <div className="flex flex-col gap-12">
      <div className="rounded-md bg-stone-100 px-5 py-3 text-sm text-stone-700">
        <span className="inline-flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          <span>This is a protected page that is only visible to authenticated InsForge users.</span>
        </span>
      </div>

      <div className="flex flex-col gap-3 items-start">
        <h2 className="text-2xl font-bold text-stone-950">Your user details</h2>
        <pre className="max-h-64 overflow-auto rounded-xl border border-stone-200 bg-white p-4 text-xs text-stone-800">
          {JSON.stringify(user ?? viewer, null, 2)}
        </pre>
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-bold text-stone-950">Next steps</h2>
        <FetchDataSteps />
      </div>
    </div>
  );
}
