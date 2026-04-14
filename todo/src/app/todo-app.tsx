"use client";

import { useEffect, useState } from "react";
import { insforge } from "./insforge-client";

interface Todo {
  id: string;
  text: string;
  created_at: string;
  is_completed: boolean;
}

export function TodoApp({ dashboardUrl }: { dashboardUrl: string }) {
  const [input, setInput] = useState("");
  const [todos, setTodos] = useState<Todo[]>([]);
  useEffect(() => {
    fetchTodos();
  }, []);

  async function fetchTodos() {
    const { data, error } = await insforge.database
      .from("todo")
      .select()
      .order("created_at", { ascending: false });
    if (!error && data) {
      setTodos(data as Todo[]);
    }
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput("");
    const optimistic: Todo = {
      id: crypto.randomUUID(),
      text: trimmed,
      created_at: new Date().toISOString(),
      is_completed: false,
    };
    setTodos((prev) => [optimistic, ...prev]);
    insforge.database
      .from("todo")
      .insert([{ text: trimmed }])
      .select()
      .then(({ data }) => {
        if (data?.length) {
          setTodos((prev) =>
            prev.map((t) => (t.id === optimistic.id ? (data[0] as Todo) : t))
          );
        }
      });
  }

  async function handleToggle(id: string, currentValue: boolean) {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, is_completed: !currentValue } : t
      )
    );
    await insforge.database
      .from("todo")
      .update({ is_completed: !currentValue })
      .eq("id", id);
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Main */}
      <main className="flex flex-1 items-center justify-center">
        <div className="flex w-[343px] flex-col items-center gap-7">
          <h1 className="w-full text-center text-[22px] font-bold text-white">
            To Do List
          </h1>

          {/* Add todo */}
          <form onSubmit={handleAdd} className="flex w-full gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Add a new task..."
                className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-[#a3a3a3] focus:outline-none"
              />
              <button
                type="submit"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="black"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </form>

          {/* Todo list */}
          <ul className="flex w-full flex-col gap-3">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className="flex items-center gap-2.5 rounded-lg border border-white/[0.08] bg-white px-3.5 py-2.5 transition"
              >
                <button
                  type="button"
                  onClick={() => handleToggle(todo.id, todo.is_completed)}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition ${
                    todo.is_completed
                      ? "bg-emerald-500"
                      : "border-2 border-[#d4d4d4] hover:border-emerald-500/50"
                  }`}
                >
                  {todo.is_completed && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                <p className={`min-w-0 flex-1 text-sm ${todo.is_completed ? "text-[#a3a3a3] line-through" : "text-black"}`}>
                  {todo.text}
                </p>
              </li>
            ))}
          </ul>

          {/* Check backend link */}
          <a
            href={dashboardUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full text-center text-sm text-[#6ee7b7] underline"
          >
            Check Your Backend!
          </a>
        </div>
      </main>
    </div>
  );
}
