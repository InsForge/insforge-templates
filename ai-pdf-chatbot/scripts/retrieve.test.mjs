import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildContextString, toCitations } from '../lib/rag/format.ts';

test('buildContextString: numbers sources starting at 1', () => {
  const out = buildContextString([
    { chunk_id: 'a', document_id: 'd1', file_name: 'paper.pdf', page_number: 4, content: 'Foo bar' },
    { chunk_id: 'b', document_id: 'd1', file_name: 'paper.pdf', page_number: 7, content: 'Baz qux' },
  ]);
  assert.match(out, /^\[1\] \(paper\.pdf, page 4\) Foo bar/);
  assert.match(out, /\[2\] \(paper\.pdf, page 7\) Baz qux/);
});

test('buildContextString: handles missing page_number', () => {
  const out = buildContextString([
    { chunk_id: 'a', document_id: 'd1', file_name: 'notes.pdf', page_number: null, content: 'hello' },
  ]);
  assert.match(out, /\[1\] \(notes\.pdf\) hello/);
});

test('buildContextString: empty input returns empty string', () => {
  assert.equal(buildContextString([]), '');
});

test('toCitations: truncates long snippets with ellipsis', () => {
  const long = 'x'.repeat(500);
  const [c] = toCitations([
    { chunk_id: 'a', document_id: 'd', file_name: 'f.pdf', page_number: 1, content: long },
  ]);
  assert.ok(c.snippet.length < long.length);
  assert.ok(c.snippet.endsWith('…'));
});
