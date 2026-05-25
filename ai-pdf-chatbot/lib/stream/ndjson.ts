const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function encodeNdjson(obj: unknown): Uint8Array {
  return encoder.encode(`${JSON.stringify(obj)}\n`);
}

export async function* parseNdjsonStream(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<unknown, void, void> {
  const reader = stream.getReader();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIdx: number;
      while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIdx).trim();
        buffer = buffer.slice(newlineIdx + 1);
        if (line) yield JSON.parse(line);
      }
    }

    const tail = buffer.trim();
    if (tail) yield JSON.parse(tail);
  } finally {
    reader.releaseLock();
  }
}
