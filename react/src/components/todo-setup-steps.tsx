import { DashboardLink } from "./dashboard-link";
import { PromptBlock } from "./prompt-block";
import { RefreshButton } from "./refresh-button";

const linkProjectPrompt = `npx @insforge/cli link`.trim();

const createSchemaPrompt = `Create a todos table in my InsForge project with Row Level Security:

- Table name: todos
- Columns (use exactly these names):
  - id: UUID, primary key, default gen_random_uuid()
  - user_id: UUID, references auth.users(id), default auth.uid()
  - title: text, required
  - is_complete: boolean, default false
  - created_at: timestamp, default now
- Enable Row Level Security
- Add RLS policies for authenticated users only (users can only access their own todos):
  - SELECT: auth.uid() = user_id
  - INSERT: true (user_id is auto-set via DEFAULT auth.uid())
  - UPDATE: auth.uid() = user_id
  - DELETE: auth.uid() = user_id`.trim();

export const debugPrompt = `My todos page is showing an error. Please help me debug:

1. Fetch the todos table schema from my InsForge project
2. Compare it with what the frontend expects:
   - user_id (UUID, references auth.users)
   - title (text)
   - is_complete (boolean)
   - created_at (timestamp)
3. Check RLS policies are correctly configured for authenticated users
4. Fix any mismatches - either update the table schema or adjust the frontend code`.trim();

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

interface StepProps {
  number: number;
  title: string;
  isComplete: boolean;
  children: React.ReactNode;
}

function Step({ number, title, isComplete, children }: StepProps) {
  return (
    <li className="relative">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
            isComplete
              ? "bg-emerald-500 text-white"
              : "border border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)]"
          }`}
        >
          {isComplete ? <CheckIcon /> : number}
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className={`text-sm font-medium ${
              isComplete ? "text-[var(--muted-foreground)]" : "text-[var(--foreground)]"
            }`}
          >
            {title}
            {isComplete && (
              <span className="ml-2 text-xs font-normal text-emerald-500">Done</span>
            )}
          </h3>
          {!isComplete && (
            <div className="mt-2 space-y-3 text-sm text-[var(--muted-foreground)]">
              {children}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

interface TodoSetupStepsProps {
  tableExists: boolean;
  hasData: boolean;
  playground?: React.ReactNode;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function TodoSetupSteps({ tableExists, hasData, playground, onRefresh, isRefreshing }: TodoSetupStepsProps) {
  const step1Done = tableExists;
  const step2Done = tableExists;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-[var(--foreground)]">Setup Steps</h3>
      <ol className="space-y-4">
        <Step number={1} title="Link your project to InsForge" isComplete={step1Done}>
          <p>
            Connect your AI agent to this project. This installs the InsForge CLI and skills.
          </p>
          <PromptBlock prompt={linkProjectPrompt} label="Run in your terminal" variant="terminal" />
        </Step>

        <Step number={2} title="Create the todos table" isComplete={step2Done}>
          <p>Create a database table with Row Level Security.</p>
          <PromptBlock prompt={createSchemaPrompt} />
          <RefreshButton onRefresh={onRefresh} isRefreshing={isRefreshing} />
        </Step>
      </ol>

      {tableExists && playground && (
        <div className="ml-9">{playground}</div>
      )}

      <ol className="space-y-4" start={3}>
        <Step number={3} title="View your data in the Dashboard" isComplete={false}>
          <p>
            Open the <DashboardLink className="font-medium text-[var(--foreground)] hover:underline" /> to
            see your todos table{hasData ? " and the data you just created" : ""}.
          </p>
        </Step>
      </ol>
    </div>
  );
}

export function DebugPromptBlock({ onRefresh, isRefreshing }: { onRefresh: () => void; isRefreshing: boolean }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--muted-foreground)]">
        Something went wrong fetching your todos. Copy this prompt to your AI agent to diagnose
        and fix the issue:
      </p>
      <PromptBlock prompt={debugPrompt} label="Debug with AI agent" />
      <RefreshButton onRefresh={onRefresh} isRefreshing={isRefreshing} />
    </div>
  );
}
