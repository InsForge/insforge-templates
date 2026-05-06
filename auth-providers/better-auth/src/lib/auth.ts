import { betterAuth } from 'better-auth';
import { Pool } from 'pg';

// Fail at module-load if a required var is missing. Better than `!` because
// the error names the missing var instead of crashing on a downstream undefined.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}. Copy .env.example to .env.local and fill it in.`);
  }
  return value;
}

// Better Auth's tables live in a dedicated `better_auth` schema, not `public`.
// PostgREST exposes only `public` by default, so the schema is hidden from
// the InsForge data API by construction — no REVOKE step needed. The InsForge
// dashboard reaches `better_auth.*` through its admin route (postgres
// superuser pool), so Studio inspection still works.
//
// `pg.Pool` doesn't take a `schema` option; the standard way to scope BA's
// queries to a specific schema is via Postgres `search_path`. We set it on
// every new pooled connection so BA's `CREATE TABLE`, `INSERT`, `SELECT`
// (and the `better-auth migrate` CLI when it imports this file) all resolve
// to `better_auth.*`. `public` stays in the path for `gen_random_uuid()` etc.
const pool = new Pool({ connectionString: requireEnv('DATABASE_URL') });
pool.on('connect', (client) => {
  // Best-effort: we don't fail the connection on this — if the schema
  // doesn't exist yet, the next migrate run creates it via 01-schema.sql.
  client.query('SET search_path TO better_auth, public').catch(() => { /* noop */ });
});

export const auth = betterAuth({
  database: pool,
  emailAndPassword: { enabled: true },
  secret: requireEnv('BETTER_AUTH_SECRET'),
  baseURL: requireEnv('BETTER_AUTH_URL'),

  // ─────────────────────────────────────────────────────────────────────────
  // Optional: route BA's verification + reset emails through InsForge.
  // Enable by uncommenting and configuring SMTP via PUT /api/auth/smtp-config
  // (or use cloud-hosted InsForge where PROJECT_ID is set).
  //
  // emailAndPassword: {
  //   enabled: true,
  //   requireEmailVerification: true,
  //   sendResetPassword: async ({ user, url }) => {
  //     const c = await import('./insforge-server-mailer').then(m => m.serverMailer());
  //     const { error } = await c.emails.send({
  //       to: user.email,
  //       subject: 'Reset your password',
  //       html: `<p>Reset: <a href="${url}">${url}</a></p>`,
  //     });
  //     if (error) throw new Error(error.message);
  //   },
  // },
  // emailVerification: {
  //   sendOnSignUp: true,
  //   sendVerificationEmail: async ({ user, url }) => {
  //     const c = await import('./insforge-server-mailer').then(m => m.serverMailer());
  //     const { error } = await c.emails.send({
  //       to: user.email,
  //       subject: 'Verify your email',
  //       html: `<p>Verify: <a href="${url}">${url}</a></p>`,
  //     });
  //     if (error) throw new Error(error.message);
  //   },
  // },
});
