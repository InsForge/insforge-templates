import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { Pool } from 'pg';

// During `next build`, Next.js loads route modules to collect page
// data BEFORE .env.local is consulted in the same way as `next dev` /
// `next start`. Throwing on a missing var at module-load would break
// every CI build that doesn't preload secrets. Use clearly-fake
// placeholders during the build phase only; real requests fail loudly
// at first use if the actual env is missing.
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

function readEnv(name: string, buildFallback: string): string {
  const value = process.env[name];
  if (value) return value;
  if (isBuildPhase) return buildFallback;
  throw new Error(`Missing required env var: ${name}. Copy .env.example to .env.local and fill it in.`);
}

// Better Auth's tables live in a dedicated `better_auth` schema, not `public`.
// PostgREST exposes only `public` by default, so the schema is hidden from
// the InsForge data API by construction — no REVOKE step needed.
//
// `pg.Pool` doesn't take a `schema` option, so we scope BA's queries via
// Postgres `search_path` as a startup option (`-c search_path=…`). A
// `pool.on('connect')` listener would be too late — BA/Kysely can dispatch
// queries on a fresh connection BEFORE the SET completes, hitting
// `relation "user" does not exist`. `public` stays in the path for
// `gen_random_uuid()` and other extensions.
//
// pg-connection-string v2 treats `sslmode=require` as `verify-full`, which
// rejects InsForge cloud's self-signed Postgres cert with
// `DEPTH_ZERO_SELF_SIGNED_CERT`. Strip the param via the URL API (regex
// would leave a stray `&`) and apply our `rejectUnauthorized: false`
// override explicitly. Local stacks (no sslmode) get a plain non-TLS
// connection.
const databaseUrl = readEnv('DATABASE_URL', 'postgresql://build:build@127.0.0.1:5432/build');
const parsedUrl = new URL(databaseUrl);
const hasSslmode = parsedUrl.searchParams.has('sslmode');
parsedUrl.searchParams.delete('sslmode');
const pool = new Pool({
  connectionString: parsedUrl.toString(),
  ssl: hasSslmode ? { rejectUnauthorized: false } : undefined,
  options: '-c search_path=better_auth,public',
});

export const auth = betterAuth({
  database: pool,
  secret: readEnv('BETTER_AUTH_SECRET', 'build-only-placeholder-please-set-real-secret'),
  baseURL: readEnv('BETTER_AUTH_URL', 'http://localhost:3000'),

  emailAndPassword: {
    enabled: true,
    // Wire BA's password-reset email through InsForge's email service.
    // Requires SMTP configured on the InsForge side (cloud: automatic;
    // self-hosted: PUT /api/auth/smtp-config).
    sendResetPassword: async ({ user, url }) => {
      const { serverMailer } = await import('./insforge-server-mailer');
      const c = serverMailer();
      const { error } = await c.emails.send({
        to: user.email,
        subject: 'Reset your password',
        html: `<p>Click to reset your password: <a href="${url}">${url}</a></p>`,
      });
      if (error) throw new Error(error.message ?? 'Failed to send reset email');
    },
  },

  // nextCookies bridges BA's cookie writes through Next.js's cookies()
  // API so server actions (e.g. signOut in lib/auth-actions.ts) actually
  // clear the session cookie. Without it, signOut hits the API but the
  // browser-side cookie sticks around until next request.
  plugins: [nextCookies()],
});
