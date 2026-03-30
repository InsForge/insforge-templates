"use server";

import { redirect } from "next/navigation";

import {
  clearAuthCookies,
  consumePkceVerifier,
  setAuthCookies,
  setPkceVerifier,
} from "@/lib/auth-cookies";
import { getInsforgeServerClient } from "@/lib/insforge";

type AuthResult = { success: true } | { success: false; error: string };

export async function getAuthConfig() {
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;

  if (!baseUrl) {
    return { oAuthProviders: [] as string[], requireEmailVerification: false, passwordMinLength: 8 };
  }

  const response = await fetch(`${baseUrl}/api/auth/public-config`, { cache: "no-store" });

  if (!response.ok) {
    return { oAuthProviders: [] as string[], requireEmailVerification: false, passwordMinLength: 8 };
  }

  return response.json() as Promise<{
    requireEmailVerification: boolean;
    passwordMinLength: number;
    verifyEmailMethod: string;
    resetPasswordMethod: string;
    oAuthProviders: string[];
  }>;
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const insforge = getInsforgeServerClient();
  const { data, error } = await insforge.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.statusCode === 403) {
      return { success: false, error: "Email not verified. Please verify your email first." };
    }

    return { success: false, error: error.message ?? "Sign in failed." };
  }

  if (!data?.accessToken || !data?.refreshToken) {
    return { success: false, error: "Sign in failed." };
  }

  await setAuthCookies(data.accessToken, data.refreshToken);
  return { success: true };
}

export async function signUp(
  email: string,
  password: string,
  name: string,
): Promise<{ success: true; requireVerification: boolean } | { success: false; error: string }> {
  const insforge = getInsforgeServerClient();
  const { data, error } = await insforge.auth.signUp({ email, password, name });

  if (error) {
    return { success: false, error: error.message ?? "Sign up failed." };
  }

  if (data?.requireEmailVerification) {
    return { success: true, requireVerification: true };
  }

  if (data?.accessToken && data?.refreshToken) {
    await setAuthCookies(data.accessToken, data.refreshToken);
    return { success: true, requireVerification: false };
  }

  return { success: false, error: "Sign up failed." };
}

export async function verifyEmail(email: string, otp: string): Promise<AuthResult> {
  const insforge = getInsforgeServerClient();
  const { data, error } = await insforge.auth.verifyEmail({ email, otp });

  if (error) {
    return { success: false, error: error.message ?? "Verification failed." };
  }

  if (data?.accessToken && data?.refreshToken) {
    await setAuthCookies(data.accessToken, data.refreshToken);
  }

  return { success: true };
}

export async function resendVerification(email: string): Promise<AuthResult> {
  const insforge = getInsforgeServerClient();

  try {
    await insforge.auth.resendVerificationEmail({ email });
    return { success: true };
  } catch {
    return { success: false, error: "Failed to resend verification code." };
  }
}

export async function sendResetEmail(email: string): Promise<AuthResult> {
  const insforge = getInsforgeServerClient();

  try {
    await insforge.auth.sendResetPasswordEmail({ email });
    return { success: true };
  } catch {
    return { success: false, error: "Failed to send reset email." };
  }
}

export async function exchangeResetCode(
  email: string,
  code: string,
): Promise<{ success: true; token: string } | { success: false; error: string }> {
  const insforge = getInsforgeServerClient();
  const { data, error } = await insforge.auth.exchangeResetPasswordToken({ email, code });

  if (error || !data?.token) {
    return { success: false, error: error?.message ?? "Invalid or expired code." };
  }

  return { success: true, token: data.token };
}

export async function resetPassword(newPassword: string, otp: string): Promise<AuthResult> {
  const insforge = getInsforgeServerClient();
  const { error } = await insforge.auth.resetPassword({ newPassword, otp });

  if (error) {
    return { success: false, error: error.message ?? "Password reset failed." };
  }

  return { success: true };
}

export async function getOAuthUrl(provider: string): Promise<{ url: string } | { error: string }> {
  const insforge = getInsforgeServerClient();
  const origin =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : process.env.NEXT_PUBLIC_APP_URL!;

  type OAuthProvider = Parameters<typeof insforge.auth.signInWithOAuth>[0]["provider"];

  const { data, error } = await insforge.auth.signInWithOAuth({
    provider: provider as OAuthProvider,
    redirectTo: `${origin}/auth/callback`,
    skipBrowserRedirect: true,
  });

  if (error || !data?.url) {
    return { error: error?.message ?? "OAuth failed." };
  }

  if (data.codeVerifier) {
    await setPkceVerifier(data.codeVerifier);
  }

  return { url: data.url };
}

export async function exchangeAuthCode(code: string): Promise<AuthResult> {
  const insforge = getInsforgeServerClient();
  const codeVerifier = await consumePkceVerifier();
  const { data, error } = await insforge.auth.exchangeOAuthCode(code, codeVerifier ?? undefined);

  if (error || !data?.accessToken) {
    return { success: false, error: error?.message ?? "Code exchange failed." };
  }

  if (data.refreshToken) {
    await setAuthCookies(data.accessToken, data.refreshToken);
  }

  return { success: true };
}

export async function signOut() {
  const insforge = getInsforgeServerClient();

  try {
    await insforge.auth.signOut();
  } catch {
    // Sign out locally even if the server call fails.
  }

  await clearAuthCookies();
  redirect("/auth/sign-in");
}
