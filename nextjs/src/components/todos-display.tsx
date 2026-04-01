import { getAccessToken } from "@/lib/auth-cookies";
import { createInsforgeServerClient } from "@/lib/insforge";
import { TodoSetupSteps, DebugPromptBlock } from "@/components/tutorial/todo-setup-steps";
import { AddTodoForm } from "@/components/add-todo-form";
import { TodoItem } from "@/components/todo-item";

interface Todo {
  id: number;
  user_id: string;
  title: string;
  is_complete: boolean;
  created_at: string;
}

function validateTodoSchema(data: unknown[]): data is Todo[] {
  if (!data.length) return true;
  const firstRow = data[0] as Record<string, unknown>;
  return "user_id" in firstRow && "title" in firstRow && "is_complete" in firstRow;
}

function isTableNotFoundError(error: { message?: string; code?: string }): boolean {
  const message = error.message?.toLowerCase() ?? "";
  const code = error.code?.toLowerCase() ?? "";
  return (
    message.includes("does not exist") ||
    message.includes("relation") ||
    code === "42p01" ||
    code === "pgrst204"
  );
}

function TodosPlayground({ todos }: { todos: Todo[] }) {
  return (
    <div className="space-y-4">
      <AddTodoForm />
      {todos.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--muted-foreground)]">
              {todos.length} {todos.length === 1 ? "todo" : "todos"}
            </p>
          </div>
          <ul className="space-y-3">
            {todos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} />
            ))}
          </ul>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-muted)] px-4 py-6 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            No todos yet. Add your first todo above!
          </p>
        </div>
      )}
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/20">
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
              className="text-red-400"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-red-400">Error loading todos</h3>
            <p className="mt-1 text-sm text-red-300/80">{error}</p>
          </div>
        </div>
      </div>

      <DebugPromptBlock />
    </div>
  );
}

export async function TodosDisplay() {
  const accessToken = await getAccessToken();
  const insforge = createInsforgeServerClient({ accessToken: accessToken ?? undefined });

  const { data, error } = await insforge.database
    .from("todos")
    .select("*")
    .order("created_at", { ascending: false });

  // Handle table not found - show only tutorial
  if (error && isTableNotFoundError(error)) {
    return (
      <div className="space-y-8">
        <p className="text-sm text-[var(--muted-foreground)]">
          Create your first database table using natural language prompts.
        </p>
        <TodoSetupSteps tableExists={false} hasData={false} />
      </div>
    );
  }

  // Handle other errors
  if (error) {
    return <ErrorState error={error.message ?? "Unknown error occurred"} />;
  }

  // Handle schema mismatch
  if (data && !validateTodoSchema(data)) {
    return (
      <ErrorState error="The todos table exists but has an unexpected schema. The expected columns are: user_id, title, is_complete, created_at." />
    );
  }

  const todos = data ?? [];
  const hasData = todos.length > 0;

  // Table exists - show tutorial progress with playground between step 2 and 3
  return (
    <div className="space-y-8">
      <TodoSetupSteps
        tableExists={true}
        hasData={hasData}
        playground={<TodosPlayground todos={todos} />}
      />
    </div>
  );
}
