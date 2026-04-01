"use client";

import { useState } from "react";

import { exchangeResetCode, resetPassword, sendResetEmail } from "@/lib/auth-actions";

export function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [token, setToken] = useState("");
  const [step, setStep] = useState<"email" | "code" | "password">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSendEmail(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    const result = await sendResetEmail(email.trim());

    if (!result.success) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    setMessage("Check your email for a reset code.");
    setStep("code");
    setIsLoading(false);
  }

  async function handleVerifyCode(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    const result = await exchangeResetCode(email.trim(), code.trim());

    if (!result.success) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    setToken(result.token);
    setStep("password");
    setIsLoading(false);
  }

  async function handleResetPassword(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    const result = await resetPassword(newPassword, token);

    if (!result.success) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    window.location.href = "/auth/sign-in";
  }

  return (
    <div className="space-y-6">
      {step === "email" ? (
        <>
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Reset password</h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Enter your email and we&apos;ll send you a reset code
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSendEmail}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground)]" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--foreground)]"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

            <button
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-[var(--foreground)] px-4 text-sm font-medium text-[var(--surface)] opacity-100 transition hover:opacity-90 disabled:opacity-50"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send reset code"}
            </button>
          </form>
        </>
      ) : null}

      {step === "code" ? (
        <>
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Enter reset code</h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              We sent a code to <span className="font-medium text-[var(--foreground)]">{email}</span>
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleVerifyCode}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground)]" htmlFor="code">
                Reset code
              </label>
              <input
                id="code"
                type="text"
                required
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-center text-lg tracking-[0.35em] text-[var(--foreground)] outline-none transition focus:border-[var(--foreground)]"
                placeholder="000000"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              />
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

            <button
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-[var(--foreground)] px-4 text-sm font-medium text-[var(--surface)] opacity-100 transition hover:opacity-90 disabled:opacity-50"
              type="submit"
              disabled={isLoading || code.length < 6}
            >
              {isLoading ? "Verifying..." : "Verify code"}
            </button>
          </form>
        </>
      ) : null}

      {step === "password" ? (
        <>
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Set new password</h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">Choose a new password for your account</p>
          </div>

          <form className="space-y-4" onSubmit={handleResetPassword}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground)]" htmlFor="new-password">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                required
                autoComplete="new-password"
                className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--foreground)]"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-[var(--foreground)] px-4 text-sm font-medium text-[var(--surface)] opacity-100 transition hover:opacity-90 disabled:opacity-50"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Resetting..." : "Reset password"}
            </button>
          </form>
        </>
      ) : null}
    </div>
  );
}
