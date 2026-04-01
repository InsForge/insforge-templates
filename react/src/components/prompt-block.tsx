import { useState } from "react";

function CopyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v6l3-3M12 3v6l-3-3" />
      <path d="m9 12 3 3 3-3" />
      <path d="M12 21v-6l3 3M12 21v-6l-3 3" />
      <path d="M3 12h6l-3-3M3 12h6l-3 3" />
      <path d="M21 12h-6l3-3M21 12h-6l3 3" />
    </svg>
  );
}

function TerminalIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

export function PromptBlock({ prompt, label, variant = "agent" }: { prompt: string; label?: string; variant?: "agent" | "terminal" }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[#0c0a09] dark:bg-[#0c0a09]">
      <div className="flex items-center justify-between border-b border-stone-800 bg-stone-900/50 px-4 py-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-400">
          {variant === "terminal" ? <TerminalIcon /> : <SparkleIcon />}
          {label ?? "Copy to your AI agent"}
        </span>
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex h-7 items-center gap-1.5 rounded-md border border-stone-700 bg-stone-800 px-2.5 text-xs font-medium text-stone-300 transition hover:bg-stone-700"
          aria-label={copied ? "Copied" : "Copy prompt"}
        >
          {copied ? (
            <>
              <CheckIcon />
              Copied!
            </>
          ) : (
            <>
              <CopyIcon />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-stone-100">
        <code className="block whitespace-pre-wrap">{prompt}</code>
      </pre>
    </div>
  );
}
