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
// `pg.Pool` doesn't take a `schema` option, so we scope BA's queries via
// Postgres `search_path`. Pass it as a startup option (`-c search_path=…`)
// rather than firing `SET search_path` from a `pool.on('connect')` listener:
// the listener is async and BA/Kysely can dispatch queries against a fresh
// connection BEFORE the SET completes, hitting `relation "user" does not
// exist` because the default search_path resolves to `public`. The startup
// option is applied during connection negotiation, so every query sees
// `better_auth, public` from the very first statement. `public` stays in
// the path for `gen_random_uuid()` etc.
//
// pg-connection-string v2 treats `sslmode=require` as `verify-full`, which
// rejects InsForge cloud's self-signed Postgres cert with
// `DEPTH_ZERO_SELF_SIGNED_CERT`. When the URL has any sslmode= we keep TLS on
// but skip CA verification — same posture as `psql sslmode=require`. Local
// stacks (no sslmode in the URL) get a plain non-TLS connection.
const databaseUrl = requireEnv('DATABASE_URL');
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('sslmode=') ? { rejectUnauthorized: false } : undefined,
  options: '-c search_path=better_auth,public',
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
