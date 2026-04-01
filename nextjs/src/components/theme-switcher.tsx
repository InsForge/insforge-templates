"use client";

import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "insforge-theme";

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolvedTheme = theme === "system" ? (systemPrefersDark ? "dark" : "light") : theme;

  root.dataset.theme = resolvedTheme;
  root.style.colorScheme = resolvedTheme;
}

function getResolvedTheme(theme: ThemeMode) {
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return theme === "system" ? (systemPrefersDark ? "dark" : "light") : theme;
}

function SunIcon() {
  return (
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
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
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
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function LaptopIcon() {
  return (
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
    >
      <rect width="18" height="12" x="3" y="4" rx="2" />
      <path d="M2 20h20" />
    </svg>
  );
}

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("system");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const savedTheme = (window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null) ?? "system";
    setTheme(savedTheme);
    applyTheme(savedTheme);
    setMounted(true);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const currentTheme = (window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null) ?? "system";
      if (currentTheme === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-theme-switcher]")) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function handleThemeChange(nextTheme: ThemeMode) {
    setTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
    setOpen(false);
  }

  if (!mounted) {
    return null;
  }

  const resolvedTheme = getResolvedTheme(theme);

  return (
    <div className="relative" data-theme-switcher>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
      >
        {theme === "light" ? (
          <SunIcon />
        ) : theme === "dark" ? (
          <MoonIcon />
        ) : (
          <LaptopIcon />
        )}
      </button>

      {open ? (
        <div className="absolute bottom-11 right-0 z-20 min-w-36 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[0_16px_40px_rgba(0,0,0,0.14)]">
          <button
            type="button"
            onClick={() => handleThemeChange("light")}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
              theme === "light"
                ? "bg-[var(--surface-muted)] text-[var(--foreground)]"
                : "text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <SunIcon />
            <span>Light</span>
          </button>
          <button
            type="button"
            onClick={() => handleThemeChange("dark")}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
              theme === "dark"
                ? "bg-[var(--surface-muted)] text-[var(--foreground)]"
                : "text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <MoonIcon />
            <span>Dark</span>
          </button>
          <button
            type="button"
            onClick={() => handleThemeChange("system")}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
              theme === "system"
                ? "bg-[var(--surface-muted)] text-[var(--foreground)]"
                : "text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <LaptopIcon />
            <span>System</span>
            <span className="ml-auto text-xs opacity-70">{resolvedTheme}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
