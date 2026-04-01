import { useRef, useState } from "react";
import { getInsforgeClient } from "../lib/insforge";

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function AddTodoForm({ onAdded }: { onAdded: () => void }) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = (formData.get("title") as string)?.trim();

    if (!title) {
      setError("Title is required");
      return;
    }

    setError(null);
    setIsPending(true);

    const insforge = getInsforgeClient();
    const { error: dbError } = await insforge.database
      .from("todos")
      .insert({ title, is_complete: false });

    setIsPending(false);

    if (dbError) {
      setError(dbError.message);
    } else {
      formRef.current?.reset();
      onAdded();
    }
  }

  return (
    <form ref={formRef} onSubmit={(e) => void handleSubmit(e)} className="flex gap-2">
      <input
        type="text"
        name="title"
        placeholder="Add a new todo..."
        disabled={isPending}
        className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--foreground)] px-3 py-2 text-sm font-medium text-[var(--background)] transition hover:opacity-90 disabled:opacity-50"
      >
        <PlusIcon />
        Add
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  );
}
