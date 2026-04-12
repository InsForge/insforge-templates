"use client";

import { useEffect, useState } from "react";
import { insforge } from "./insforge-client";

interface Todo {
  id: number;
  text: string;
  created_at: string;
  is_completed: boolean;
}

export function TodoApp({ dashboardUrl }: { dashboardUrl: string }) {
  const [input, setInput] = useState("");
  const [todos, setTodos] = useState<Todo[]>([]);
  const [tab, setTab] = useState<"ongoing" | "completed">("ongoing");
  const [showAuth, setShowAuth] = useState(false);
  const [isSignedUp, setIsSignedUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [authStep, setAuthStep] = useState<"form" | "verify">("form");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    insforge.auth.getCurrentUser().then(({ data }) => {
      if (data?.user) setIsSignedUp(true);
    });
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
      id: -Date.now(),
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

  async function handleToggle(id: number, currentValue: boolean) {
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

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    const { data, error } = await insforge.auth.signUp({
      email,
      password,
    });
    if (error) {
      setAuthError(error.message);
      return;
    }
    if (data?.requireEmailVerification) {
      setAuthStep("verify");
    } else {
      setIsSignedUp(true);
      setShowAuth(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    const { error } = await insforge.auth.verifyEmail({ email, otp });
    if (error) {
      setAuthError(error.message);
      return;
    }
    setIsSignedUp(true);
    setShowAuth(false);
  }

  const filteredTodos = todos.filter((todo) =>
    tab === "ongoing" ? !todo.is_completed : todo.is_completed
  );

  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <nav className="flex h-16 w-full items-center justify-end gap-3 px-6">
        {!isSignedUp && (
          <button
            onClick={() => setShowAuth(true)}
            className="rounded-[4px] bg-white px-3 py-2 text-sm font-medium text-black"
          >
            Sign Up
          </button>
        )}
      </nav>

      {/* Auth Modal */}
      {showAuth && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowAuth(false)}
        >
          <div
            className="flex w-[320px] flex-col gap-4 rounded-xl bg-[#2a2a2a] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {authStep === "form" ? (
              <form onSubmit={handleSignUp} className="flex flex-col gap-4">
                <h2 className="text-center text-lg font-semibold text-white">
                  Sign Up
                </h2>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-[#a3a3a3] focus:outline-none"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  minLength={6}
                  className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-[#a3a3a3] focus:outline-none"
                />
                {authError && (
                  <p className="text-xs text-red-400">{authError}</p>
                )}
                <button
                  type="submit"
                  className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-gray-100"
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  onClick={() => setShowAuth(false)}
                  className="text-sm text-[#a3a3a3] transition hover:text-white"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="flex flex-col gap-4">
                <h2 className="text-center text-lg font-semibold text-white">
                  Verify Email
                </h2>
                <p className="text-center text-sm text-[#a3a3a3]">
                  Enter the 6-digit code sent to {email}
                </p>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  required
                  maxLength={6}
                  className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-center text-lg tracking-widest text-white placeholder:text-[#a3a3a3] focus:outline-none"
                />
                {authError && (
                  <p className="text-xs text-red-400">{authError}</p>
                )}
                <button
                  type="submit"
                  className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-gray-100"
                >
                  Verify
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex flex-1 items-center justify-center">
        <div className="flex w-[343px] flex-col items-center gap-7">
          <h1 className="w-full text-center text-[22px] font-bold text-white">
            To Do List
          </h1>

          {/* Toggle nav */}
          <div className="flex w-full overflow-hidden rounded-[4px] border border-white/[0.08] bg-white/[0.04]">
            <button
              type="button"
              onClick={() => setTab("ongoing")}
              className={`flex-1 px-3 py-1.5 text-sm transition ${
                tab === "ongoing"
                  ? "bg-[#323232] text-white"
                  : "text-[#a3a3a3] hover:text-white"
              }`}
            >
              Ongoing
            </button>
            <button
              type="button"
              onClick={() => setTab("completed")}
              className={`flex-1 px-3 py-1.5 text-sm transition ${
                tab === "completed"
                  ? "bg-[#323232] text-white"
                  : "text-[#a3a3a3] hover:text-white"
              }`}
            >
              Completed
            </button>
          </div>

          {/* Add todo (only in ongoing tab) */}
          {tab === "ongoing" && (
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
          )}

          {/* Todo list */}
          <ul className="flex w-full flex-col gap-3">
            {filteredTodos.map((todo) => (
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
                <p className="min-w-0 flex-1 text-sm text-black">
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
