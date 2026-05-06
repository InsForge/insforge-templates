#!/usr/bin/env node
// Apply sql/*.sql to DATABASE_URL in lexical order. No psql dependency.
//
// Optional prefix arg: only run files whose name starts with the given
// string. Used by `npm run setup` to split the SQL into two phases around
// `auth:migrate`:
//   1. `setup-db.mjs 01-`  → runs 01-schema.sql (creates better_auth schema)
//   2. (auth:migrate creates better_auth.user etc.)
//   3. `setup-db.mjs 02-`  → runs 02-app.sql (notes + RLS, FK to better_auth)
// Calling without an arg runs every *.sql file (used for one-shot reruns).
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const sqlDir = join(here, '..', 'sql');
const prefix = process.argv[2] ?? '';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Add it to .env.local first.');
  process.exit(1);
}

const files = readdirSync(sqlDir)
  .filter((f) => f.endsWith('.sql') && f.startsWith(prefix))
  .sort();

if (files.length === 0) {
  console.log(`(no SQL files matching prefix "${prefix}" — nothing to do)`);
  process.exit(0);
}

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  for (const f of files) {
    const sql = readFileSync(join(sqlDir, f), 'utf8');
    process.stdout.write(`▸ ${f} ... `);
    await client.query(sql);
    console.log('ok');
  }
} finally {
  await client.end();
}
