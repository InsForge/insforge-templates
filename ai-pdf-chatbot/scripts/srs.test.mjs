import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { schedule } from '../lib/srs/schedule.ts';

const NOW = new Date('2026-06-01T00:00:00.000Z');
const fresh = { ease: 2.5, interval_days: 0, reps: 0 };

test('first review "good" schedules one day out', () => {
  const next = schedule(fresh, 'good', NOW);
  assert.equal(next.interval_days, 1);
  assert.equal(next.reps, 1);
  assert.equal(next.last_grade, 2);
  assert.equal(next.due_at.toISOString(), '2026-06-02T00:00:00.000Z');
});

test('first review "easy" schedules three days out and bumps ease', () => {
  const next = schedule(fresh, 'easy', NOW);
  assert.equal(next.interval_days, 3);
  assert.equal(next.ease, 2.65);
});

test('"again" on a mature card resets interval and lapses ease', () => {
  const mature = { ease: 2.5, interval_days: 10, reps: 4 };
  const next = schedule(mature, 'again', NOW);
  assert.equal(next.interval_days, 0);
  assert.equal(next.ease, 2.3);
  assert.equal(next.last_grade, 0);
  // due in 5 minutes
  const delta = next.due_at.getTime() - NOW.getTime();
  assert.equal(delta, 5 * 60 * 1000);
});

test('"good" on a mature card geometric-steps by ease', () => {
  const mature = { ease: 2.5, interval_days: 4, reps: 3 };
  const next = schedule(mature, 'good', NOW);
  assert.equal(next.interval_days, 10);
});

test('ease has a hard floor at 1.3', () => {
  const wobbly = { ease: 1.4, interval_days: 5, reps: 5 };
  const lapsed = schedule(wobbly, 'again', NOW);
  assert.equal(lapsed.ease, 1.3);
  const harder = schedule({ ease: 1.32, interval_days: 5, reps: 5 }, 'hard', NOW);
  assert.equal(harder.ease, 1.3);
});

test('"hard" on a mature card steps by 1.2', () => {
  const mature = { ease: 2.5, interval_days: 4, reps: 3 };
  const next = schedule(mature, 'hard', NOW);
  assert.equal(next.interval_days, 4.8);
  assert.equal(next.ease, 2.45);
});

test('next interval clamped to at least one day', () => {
  // tiny mature interval + low ease — geometric step rounds to < 1
  const fragile = { ease: 1.3, interval_days: 0.5, reps: 2 };
  const next = schedule(fragile, 'good', NOW);
  assert.equal(next.interval_days, 1);
});
