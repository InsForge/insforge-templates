import { describe, expect, it, vi, beforeEach } from 'vitest';

const insertMock = vi.fn();
const fromMock = vi.fn(() => ({ insert: insertMock }));

vi.mock('@/lib/insforge', () => ({
  getInsforgeServerClient: () => ({ database: { from: fromMock } }),
}));

import { submitWaitlist } from '../waitlist';

function fd(fields: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.append(k, v);
  return f;
}

describe('submitWaitlist', () => {
  beforeEach(() => {
    insertMock.mockReset();
    fromMock.mockClear();
  });

  it('rejects empty email', async () => {
    const result = await submitWaitlist({ ok: false }, fd({ email: '' }));
    expect(result).toEqual({ ok: false, error: 'Enter a valid email.' });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('rejects malformed email', async () => {
    const result = await submitWaitlist({ ok: false }, fd({ email: 'not-an-email' }));
    expect(result.ok).toBe(false);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('inserts a valid email with default source "hero"', async () => {
    insertMock.mockResolvedValueOnce({ data: null, error: null });
    const result = await submitWaitlist({ ok: false }, fd({ email: 'jane@example.com' }));
    expect(fromMock).toHaveBeenCalledWith('waitlist');
    expect(insertMock).toHaveBeenCalledWith([{ email: 'jane@example.com', source: 'hero' }]);
    expect(result.ok).toBe(true);
  });

  it('passes through explicit source', async () => {
    insertMock.mockResolvedValueOnce({ data: null, error: null });
    await submitWaitlist({ ok: false }, fd({ email: 'a@b.com', source: 'footer' }));
    expect(insertMock).toHaveBeenCalledWith([{ email: 'a@b.com', source: 'footer' }]);
  });

  it('treats duplicate (23505) as success-ish', async () => {
    insertMock.mockResolvedValueOnce({ data: null, error: { code: '23505' } });
    const result = await submitWaitlist({ ok: false }, fd({ email: 'dup@example.com' }));
    expect(result).toEqual({ ok: true, message: "You're already on the list." });
  });

  it('returns generic error on other SDK errors', async () => {
    insertMock.mockResolvedValueOnce({ data: null, error: { code: '42501', message: 'denied' } });
    const result = await submitWaitlist({ ok: false }, fd({ email: 'a@b.com' }));
    expect(result).toEqual({ ok: false, error: 'Something went wrong. Please try again.' });
  });

  it('trims whitespace from email', async () => {
    insertMock.mockResolvedValueOnce({ data: null, error: null });
    await submitWaitlist({ ok: false }, fd({ email: '  user@example.com  ' }));
    expect(insertMock).toHaveBeenCalledWith([{ email: 'user@example.com', source: 'hero' }]);
  });
});
