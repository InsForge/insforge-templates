import { cookies } from "next/headers";

const ACCESS_COOKIE = "insforge_access_token";
const REFRESH_COOKIE = "insforge_refresh_token";
const PKCE_VERIFIER_COOKIE = "insforge_pkce_verifier";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const store = await cookies();
  store.set(ACCESS_COOKIE, accessToken, { ...cookieOptions, maxAge: 60 * 15 });
  store.set(REFRESH_COOKIE, refreshToken, { ...cookieOptions, maxAge: 60 * 60 * 24 * 7 });
}

export async function clearAuthCookies() {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

export async function getAccessToken() {
  const store = await cookies();
  return store.get(ACCESS_COOKIE)?.value ?? null;
}

export async function getRefreshToken() {
  const store = await cookies();
  return store.get(REFRESH_COOKIE)?.value ?? null;
}

export async function setPkceVerifier(verifier: string) {
  const store = await cookies();
  store.set(PKCE_VERIFIER_COOKIE, verifier, { ...cookieOptions, maxAge: 60 * 10 });
}

export async function consumePkceVerifier() {
  const store = await cookies();
  const verifier = store.get(PKCE_VERIFIER_COOKIE)?.value ?? null;

  if (verifier) {
    store.delete(PKCE_VERIFIER_COOKIE);
  }

  return verifier;
}
