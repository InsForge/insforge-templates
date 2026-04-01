export function LogoutButton() {
  return (
    <form action="/auth/sign-out" method="post">
      <button
        type="submit"
        className="inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
      >
        Logout
      </button>
    </form>
  );
}
