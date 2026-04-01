import { signOut } from "@/lib/auth-actions";

export function LogoutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="inline-flex items-center rounded-md border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-900 hover:bg-stone-50"
      >
        Logout
      </button>
    </form>
  );
}
