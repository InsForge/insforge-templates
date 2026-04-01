import { useState } from "react";
import { getInsforgeClient } from "../lib/insforge";

interface Todo {
  id: number;
  title: string;
  is_complete: boolean;
  created_at: string;
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export function TodoItem({ todo, onChanged }: { todo: Todo; onChanged: () => void }) {
  const [isPending, setIsPending] = useState(false);

  async function handleToggle() {
    setIsPending(true);
    try {
      const insforge = getInsforgeClient();
      await insforge.database
        .from("todos")
        .update({ is_complete: !todo.is_complete })
        .eq("id", todo.id);
      onChanged();
    } finally {
      setIsPending(false);
    }
  }

  async function handleDelete() {
    setIsPending(true);
    try {
      const insforge = getInsforgeClient();
      await insforge.database
        .from("todos")
        .delete()
        .eq("id", todo.id);
      onChanged();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <li
      className={`flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 transition ${
        isPending ? "opacity-50" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => void handleToggle()}
        disabled={isPending}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
          todo.is_complete
            ? "border-emerald-500 bg-emerald-500"
            : "border-[var(--border)] hover:border-emerald-500/50"
        }`}
        aria-label={todo.is_complete ? "Mark as incomplete" : "Mark as complete"}
      >
        {todo.is_complete && (
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${
            todo.is_complete
              ? "text-[var(--muted-foreground)] line-through"
              : "text-[var(--foreground)]"
          }`}
        >
          {todo.title}
        </p>
        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
          {new Date(todo.created_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
      <button
        type="button"
        onClick={() => void handleDelete()}
        disabled={isPending}
        className="shrink-0 rounded p-1 text-[var(--muted-foreground)] transition hover:bg-[var(--surface-muted)] hover:text-red-500"
        aria-label="Delete todo"
      >
        <TrashIcon />
      </button>
    </li>
  );
}
