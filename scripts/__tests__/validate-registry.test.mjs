import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { validateSchema, validateTemplate } from '../validate-registry.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const load = (name) => JSON.parse(readFileSync(join(here, 'fixtures', name), 'utf8'));
const repoRoot = resolve(here, 'fixtures', 'repo');

function entry(slug, overrides = {}) {
  return {
    slug,
    name: 'X',
    description: 'd',
    category: 'ai',
    framework: 'nextjs',
    features: [],
    tags: [],
    cover: `assets/covers/${slug}.png`,
    demo_url: null,
    author: 'X',
    added_at: '2026-01-01',
    ...overrides,
  };
}

describe('validateSchema', () => {
  it('accepts a valid entry', () => {
    expect(validateSchema(load('valid.json'))).toEqual({ ok: true, errors: [] });
  });

  it('rejects a missing required field', () => {
    const r = validateSchema(load('missing-name.json'));
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/name/i);
  });

  it('rejects duplicate slugs', () => {
    const r = validateSchema(load('duplicate-slug.json'));
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/duplicate/i);
  });

  it('rejects slugs with spaces or special chars', () => {
    const r = validateSchema(load('bad-slug.json'));
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/slug/i);
  });
});

describe('validateTemplate — filesystem', () => {
  it('accepts a well-formed template', async () => {
    expect(await validateTemplate(entry('good-slug'), repoRoot)).toEqual({
      ok: true,
      errors: [],
    });
  });

  it('rejects when LICENSE is missing', async () => {
    const r = await validateTemplate(entry('missing-license-slug'), repoRoot);
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/LICENSE/i);
  });

  it('rejects when .env.example contains a real-secret pattern', async () => {
    const r = await validateTemplate(entry('secret-leaker-slug'), repoRoot);
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/secret/i);
  });

  it('rejects when subdir does not exist', async () => {
    const r = await validateTemplate(entry('phantom'), repoRoot);
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/not found|exist/i);
  });

  it('rejects when cover file is missing', async () => {
    const r = await validateTemplate(
      entry('good-slug', { cover: 'assets/covers/missing.png' }),
      repoRoot,
    );
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/cover/i);
  });

  it('rejects cover paths that escape the repo via .. or absolute path', async () => {
    for (const bad of ['../../etc/passwd.png', '/etc/passwd.png', 'foo/../../etc']) {
      const r = await validateTemplate(entry('good-slug', { cover: bad }), repoRoot);
      expect(r.ok).toBe(false);
      expect(r.errors.join(' ')).toMatch(/must be a relative path inside the repo/i);
    }
  });
});

describe('validateTemplate — SQL', () => {
  it('accepts well-formed migration SQL', async () => {
    expect(await validateTemplate(entry('good-slug'), repoRoot)).toEqual({
      ok: true,
      errors: [],
    });
  });

  it('rejects malformed migration SQL', async () => {
    const r = await validateTemplate(entry('bad-sql-slug'), repoRoot);
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/sql|migration/i);
  });
});
