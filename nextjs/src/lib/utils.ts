export const hasEnvVars = Boolean(
  process.env.NEXT_PUBLIC_INSFORGE_URL &&
    process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY &&
    process.env.NEXT_PUBLIC_APP_URL,
);
