import { NextResponse } from "next/server";

import { clearAuthCookies } from "@/lib/auth-cookies";
import { getInsforgeServerClient } from "@/lib/insforge";

export async function POST(request: Request) {
  const insforge = getInsforgeServerClient();

  try {
    await insforge.auth.signOut();
  } catch {
    // Clear local cookies even if the upstream sign-out call fails.
  }

  await clearAuthCookies();
  return NextResponse.redirect(new URL("/auth/sign-in", request.url));
}
