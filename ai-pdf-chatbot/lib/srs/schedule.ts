// SM-2 lite spaced-repetition scheduler. Three review grades plus an
// "again" lapse, like Mochi / Quizlet's Smart Mode. Standard SM-2 uses
// five grades (0-5) which is more accurate but cognitively heavier and
// not the right default for a templates target audience (students who
// have never used Anki).
//
// Pure function — no IO, no clock dependency outside the explicit `now`
// argument — so the unit test in scripts/srs.test.mjs can pin time.

export type Grade = 'again' | 'hard' | 'good' | 'easy';

export type CardState = {
  ease: number;
  interval_days: number;
  reps: number;
};

export type Scheduled = CardState & {
  due_at: Date;
  last_grade: number; // 0 again, 1 hard, 2 good, 3 easy
};

const GRADE_CODE: Record<Grade, number> = {
  again: 0,
  hard: 1,
  good: 2,
  easy: 3,
};

const FIRST_GOOD_DAYS = 1;
const FIRST_EASY_DAYS = 3;
const AGAIN_LAPSE_MINUTES = 5;
const MIN_EASE = 1.3;

export function schedule(state: CardState, grade: Grade, now: Date = new Date()): Scheduled {
  const code = GRADE_CODE[grade];

  if (grade === 'again') {
    return {
      ease: Math.max(MIN_EASE, state.ease - 0.2),
      interval_days: 0,
      reps: state.reps + 1,
      last_grade: code,
      due_at: addMinutes(now, AGAIN_LAPSE_MINUTES),
    };
  }

  if (state.reps === 0 || state.interval_days <= 0) {
    // Brand-new card or one we just lapsed: skip the geometric step and
    // use a flat first-interval. Avoids the "good = 6h" surprise that
    // happens if you mechanically apply ease * 0 = 0 → next-day floor.
    const days = grade === 'easy' ? FIRST_EASY_DAYS : FIRST_GOOD_DAYS;
    const nextEase =
      grade === 'easy'
        ? state.ease + 0.15
        : grade === 'hard'
          ? Math.max(MIN_EASE, state.ease - 0.05)
          : state.ease;
    return {
      ease: nextEase,
      interval_days: days,
      reps: state.reps + 1,
      last_grade: code,
      due_at: addDays(now, days),
    };
  }

  // Repeat review on a mature card: standard SM-2 style geometric step.
  let nextEase = state.ease;
  let nextInterval = state.interval_days;
  if (grade === 'hard') {
    nextEase = Math.max(MIN_EASE, state.ease - 0.05);
    nextInterval = state.interval_days * 1.2;
  } else if (grade === 'good') {
    nextInterval = state.interval_days * state.ease;
  } else {
    // easy
    nextEase = state.ease + 0.15;
    nextInterval = state.interval_days * state.ease * 1.3;
  }

  // Clamp the smallest meaningful step to one day so "good" twice in a
  // row never asks the user again the same day.
  if (nextInterval < 1) nextInterval = 1;

  return {
    ease: nextEase,
    interval_days: nextInterval,
    reps: state.reps + 1,
    last_grade: code,
    due_at: addDays(now, nextInterval),
  };
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}

function addMinutes(d: Date, mins: number): Date {
  return new Date(d.getTime() + mins * 60 * 1000);
}
