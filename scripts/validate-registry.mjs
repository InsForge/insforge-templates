import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync, statSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCHEMA = {
  type: 'array',
  items: {
    type: 'object',
    additionalProperties: false,
    required: [
      'slug', 'name', 'description', 'category', 'framework',
      'features', 'tags', 'cover', 'author', 'added_at',
    ],
    properties: {
      slug: { type: 'string', pattern: '^[a-z0-9][a-z0-9-]{0,99}$' },
      name: { type: 'string', minLength: 1, maxLength: 200 },
      description: { type: 'string', minLength: 1 },
      category: { type: 'string', minLength: 1 },
      framework: { type: 'string', minLength: 1 },
      features: { type: 'array', items: { type: 'string' } },
      tags: { type: 'array', items: { type: 'string' } },
      cover: { type: 'string', minLength: 1 },
      demo_url: { type: ['string', 'null'], format: 'uri' },
      author: { type: 'string', minLength: 1, maxLength: 200 },
      added_at: { type: 'string', format: 'date' },
    },
  },
};

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(SCHEMA);

// Patterns that strongly indicate a real secret was committed.
// Surgical list — false positives block legit PRs.
const SECRET_PATTERNS = [
  /\bsk_live_[A-Za-z0-9]{16,}\b/,
  /\bphc_[A-Za-z0-9]{40,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bAIza[0-9A-Za-z_-]{35}\b/,
  /\bxox[abp]-[A-Za-z0-9-]{10,}\b/,
];

export function validateSchema(registry) {
  const errors = [];
  if (!validate(registry)) {
    for (const e of validate.errors ?? []) {
      errors.push(`${e.instancePath || '(root)'} ${e.message}`);
    }
  }
  if (Array.isArray(registry)) {
    const seen = new Set();
    for (const entry of registry) {
      if (entry && typeof entry.slug === 'string') {
        if (seen.has(entry.slug)) {
          errors.push(`duplicate slug: ${entry.slug}`);
        }
        seen.add(entry.slug);
      }
    }
  }
  return { ok: errors.length === 0, errors };
}

export async function validateTemplate(entry, repoRoot) {
  const errors = [];
  const subdir = join(repoRoot, entry.slug);
  if (!existsSync(subdir) || !statSync(subdir).isDirectory()) {
    errors.push(`${entry.slug}: subdirectory not found`);
    return { ok: false, errors };
  }
  const pkgPath = join(subdir, 'package.json');
  if (!existsSync(pkgPath)) {
    errors.push(`${entry.slug}/package.json: missing`);
  } else {
    try {
      JSON.parse(readFileSync(pkgPath, 'utf8'));
    } catch (e) {
      errors.push(`${entry.slug}/package.json: invalid JSON (${e.message})`);
    }
  }
  if (!existsSync(join(subdir, 'LICENSE'))) {
    errors.push(`${entry.slug}/LICENSE: missing`);
  }
  if (!existsSync(join(subdir, 'README.md'))) {
    errors.push(`${entry.slug}/README.md: missing`);
  }
  const envPath = join(subdir, '.env.example');
  if (!existsSync(envPath)) {
    errors.push(`${entry.slug}/.env.example: missing`);
  } else {
    const text = readFileSync(envPath, 'utf8');
    for (const re of SECRET_PATTERNS) {
      if (re.test(text)) {
        errors.push(`${entry.slug}/.env.example: looks like a real secret matched ${re}`);
        break;
      }
    }
  }
  if (entry.cover) {
    // Reject absolute paths or any `..` segment so a hostile registry entry
    // can't point cover at `/etc/passwd` or `../../some-secret/file.png`.
    // Cover must be a relative path inside the repo.
    if (
      entry.cover.startsWith('/') ||
      entry.cover.split(/[\\/]/).includes('..')
    ) {
      errors.push(
        `${entry.slug}: cover path ${entry.cover} must be a relative path inside the repo (no leading / or .. segments)`,
      );
    } else if (!existsSync(join(repoRoot, entry.cover))) {
      errors.push(`${entry.slug}: cover file ${entry.cover} not found`);
    }
  }
  // SQL parse check
  const migrationsDir = join(subdir, 'migrations');
  if (existsSync(migrationsDir) && statSync(migrationsDir).isDirectory()) {
    const { default: PgQuery } = await import('pg-query-emscripten');
    const pg = await PgQuery();
    for (const file of readdirSync(migrationsDir)) {
      if (!file.endsWith('.sql')) continue;
      const text = readFileSync(join(migrationsDir, file), 'utf8');
      const result = pg.parse(text);
      if (result.error) {
        errors.push(
          `${entry.slug}/migrations/${file}: SQL parse error: ${result.error.message}`,
        );
      }
    }
  }
  return { ok: errors.length === 0, errors };
}

// CLI: node validate-registry.mjs [registry-path] [repo-root]
if (import.meta.url === `file://${process.argv[1]}`) {
  // fileURLToPath handles Windows drive letters + URL-decoding correctly;
  // `new URL(...).pathname` mangles paths on Windows (leading slash, %xx escapes).
  const registryPath =
    process.argv[2] ?? fileURLToPath(new URL('../registry.json', import.meta.url));
  const repoRoot = process.argv[3] ?? fileURLToPath(new URL('../', import.meta.url));
  const registry = JSON.parse(readFileSync(registryPath, 'utf8'));

  const schemaResult = validateSchema(registry);
  const allErrors = [...schemaResult.errors];

  if (schemaResult.ok) {
    for (const entry of registry) {
      const r = await validateTemplate(entry, repoRoot);
      allErrors.push(...r.errors);
    }
  }

  if (allErrors.length > 0) {
    console.error('Registry validation FAILED:');
    for (const e of allErrors) console.error(`  - ${e}`);
    process.exit(1);
  } else {
    console.log(`Registry OK (${registry.length} templates).`);
  }
}
