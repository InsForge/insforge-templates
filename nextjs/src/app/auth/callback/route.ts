import { NextResponse } from "next/server";

import { exchangeAuthCode } from "@/lib/auth-actions";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("insforge_code");

  if (!code) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  const result = await exchangeAuthCode(code);

  if (result.success) {
    return NextResponse.redirect(new URL("/protected", request.url));
  }

  return NextResponse.redirect(new URL("/auth/sign-in", request.url));
}
