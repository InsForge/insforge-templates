import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeNdjson, parseNdjsonStream } from '../lib/stream/ndjson.ts';

test('encodeNdjson: single object becomes one line + newline', () => {
  const buf = encodeNdjson({ type: 'delta', text: 'hi' });
  const s = new TextDecoder().decode(buf);
  assert.equal(s, '{"type":"delta","text":"hi"}\n');
});

test('parseNdjsonStream: yields objects across chunked input', async () => {
  const chunks = [
    new TextEncoder().encode('{"type":"a"}\n{"type":"b","x":'),
    new TextEncoder().encode('1}\n{"type":"c"}\n'),
  ];
  const stream = new ReadableStream({
    start(controller) {
      for (const c of chunks) controller.enqueue(c);
      controller.close();
    },
  });

  const out = [];
  for await (const obj of parseNdjsonStream(stream)) out.push(obj);
  assert.deepEqual(out, [{ type: 'a' }, { type: 'b', x: 1 }, { type: 'c' }]);
});

test('parseNdjsonStream: skips empty lines', async () => {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('\n{"type":"a"}\n\n'));
      controller.close();
    },
  });
  const out = [];
  for await (const obj of parseNdjsonStream(stream)) out.push(obj);
  assert.deepEqual(out, [{ type: 'a' }]);
});
