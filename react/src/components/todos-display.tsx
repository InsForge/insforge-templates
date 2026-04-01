import { useCallback, useEffect, useState } from "react";
import { getInsforgeClient } from "../lib/insforge";
import { TodoSetupSteps, DebugPromptBlock } from "./todo-setup-steps";
import { AddTodoForm } from "./add-todo-form";
import { TodoItem } from "./todo-item";

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

function TodosPlayground({ todos, onChanged }: { todos: Todo[]; onChanged: () => void }) {
  return (
    <div className="space-y-4">
      <AddTodoForm onAdded={onChanged} />
      {todos.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--muted-foreground)]">
              {todos.length} {todos.length === 1 ? "todo" : "todos"}
            </p>
          </div>
          <ul className="space-y-3">
            {todos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} onChanged={onChanged} />
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

function ErrorState({ error, onRefresh, isRefreshing }: { error: string; onRefresh: () => void; isRefreshing: boolean }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
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

      <DebugPromptBlock onRefresh={onRefresh} isRefreshing={isRefreshing} />
    </div>
  );
}

export function TodosDisplay() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [tableExists, setTableExists] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTodos = useCallback(async () => {
    const insforge = getInsforgeClient();
    const { data, error: dbError } = await insforge.database
      .from("todos")
      .select("*")
      .order("created_at", { ascending: false });

    if (dbError && isTableNotFoundError(dbError)) {
      setTableExists(false);
      setError(null);
      setTodos([]);
      return;
    }

    if (dbError) {
      setTableExists(true);
      setError(dbError.message ?? "Unknown error occurred");
      return;
    }

    if (data && !validateTodoSchema(data)) {
      setTableExists(true);
      setError("The todos table exists but has an unexpected schema. The expected columns are: user_id, title, is_complete, created_at.");
      return;
    }

    setTableExists(true);
    setError(null);
    setTodos((data as Todo[]) ?? []);
  }, []);

  useEffect(() => {
    void (async () => {
      await fetchTodos();
      setIsLoading(false);
    })();
  }, [fetchTodos]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchTodos();
    setIsRefreshing(false);
  }, [fetchTodos]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="auth-callback-spinner" />
      </div>
    );
  }

  // Handle errors (including schema mismatch)
  if (error) {
    return <ErrorState error={error} onRefresh={() => void handleRefresh()} isRefreshing={isRefreshing} />;
  }

  // Table not found - show only tutorial
  if (!tableExists) {
    return (
      <div className="space-y-8">
        <p className="text-sm text-[var(--muted-foreground)]">
          Create your first database table using natural language prompts.
        </p>
        <TodoSetupSteps tableExists={false} hasData={false} onRefresh={() => void handleRefresh()} isRefreshing={isRefreshing} />
      </div>
    );
  }

  const hasData = todos.length > 0;

  // Table exists - show tutorial progress with playground between step 2 and 3
  return (
    <div className="space-y-8">
      <TodoSetupSteps
        tableExists={true}
        hasData={hasData}
        playground={<TodosPlayground todos={todos} onChanged={() => void handleRefresh()} />}
        onRefresh={() => void handleRefresh()}
        isRefreshing={isRefreshing}
      />
    </div>
  );
}
