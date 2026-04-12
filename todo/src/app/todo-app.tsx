"use client";

import { useState } from "react";

export function TodoApp({ dashboardUrl }: { dashboardUrl: string }) {
  const [input, setInput] = useState("");

  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <nav className="flex h-16 w-full items-center justify-end gap-3 px-6">
        <button className="rounded-[4px] border border-white/[0.16] bg-black px-3 py-2 text-sm font-medium text-white">
          Login
        </button>
        <button className="rounded-[4px] bg-white px-3 py-2 text-sm font-medium text-black">
          Sign Up
        </button>
      </nav>

      {/* Main */}
      <main className="flex flex-1 items-center justify-center">
        <div className="flex w-[343px] flex-col items-center gap-7">
          <h1 className="w-full text-center text-[22px] font-bold text-white">
            To Do List
          </h1>

          {/* Add todo */}
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex w-full gap-3"
          >
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

          {/* Todo list (empty - backend not connected yet) */}
          <div className="flex w-full flex-col gap-3" />

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
