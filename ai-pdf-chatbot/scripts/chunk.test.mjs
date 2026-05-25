import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chunkPages } from '../lib/pdf/chunk.ts';

test('chunkPages: short page returns one chunk', () => {
  const out = chunkPages([{ page: 1, text: 'hello world' }], { size: 800, overlap: 100 });
  assert.equal(out.length, 1);
  assert.equal(out[0].content, 'hello world');
  assert.equal(out[0].page, 1);
  assert.equal(out[0].index, 0);
});

test('chunkPages: long single page splits into multiple chunks', () => {
  const text = 'word '.repeat(500).trim();
  const out = chunkPages([{ page: 1, text }], { size: 800, overlap: 100 });
  assert.ok(out.length >= 3, `expected >=3 chunks, got ${out.length}`);
  for (let i = 0; i < out.length; i++) {
    assert.equal(out[i].page, 1);
    assert.equal(out[i].index, i);
  }
});

test('chunkPages: preserves page boundaries — chunk belongs to one page only', () => {
  const out = chunkPages(
    [
      { page: 1, text: 'alpha '.repeat(50).trim() },
      { page: 2, text: 'beta '.repeat(50).trim() },
    ],
    { size: 800, overlap: 100 },
  );
  for (const c of out) {
    if (c.page === 1) assert.ok(!c.content.includes('beta'), 'page 1 chunk leaked page 2');
    if (c.page === 2) assert.ok(!c.content.includes('alpha'), 'page 2 chunk leaked page 1');
  }
});

test('chunkPages: empty page is skipped', () => {
  const out = chunkPages(
    [
      { page: 1, text: '' },
      { page: 2, text: 'second page only' },
    ],
    { size: 800, overlap: 100 },
  );
  assert.equal(out.length, 1);
  assert.equal(out[0].page, 2);
});
