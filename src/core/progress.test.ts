import { describe, expect, it } from 'vitest';
import {
  EMPTY_PROGRESS,
  currentStreak,
  dayDiff,
  levelFor,
  levelProgress,
  parseProgress,
  recordRun,
  starsFor,
  xpFor,
  xpForLevel,
  type Progress,
} from './progress.ts';

function withStreak(current: number, best: number, lastDay: string | null): Progress {
  return { ...EMPTY_PROGRESS, streak: { current, best, lastDay } };
}

describe('stars and XP', () => {
  it('uses the exact ratio for the thresholds', () => {
    expect(starsFor(0)).toBe(1);
    expect(starsFor(0.79)).toBe(1);
    expect(starsFor(0.7999)).toBe(1);
    expect(starsFor(0.8)).toBe(2);
    expect(starsFor(0.94)).toBe(2);
    expect(starsFor(0.95)).toBe(3);
    expect(starsFor(1)).toBe(3);
  });

  it('gives 10 + 5 per star', () => {
    expect([1, 2, 3].map((s) => xpFor(s as 1 | 2 | 3))).toEqual([15, 20, 25]);
  });
});

describe('levels', () => {
  it('needs 25 * L * (L - 1) XP in total', () => {
    expect([1, 2, 3, 4, 5].map(xpForLevel)).toEqual([0, 50, 150, 300, 500]);
  });

  it('finds the level at the boundaries', () => {
    expect(levelFor(0)).toBe(1);
    expect(levelFor(49)).toBe(1);
    expect(levelFor(50)).toBe(2);
    expect(levelFor(149)).toBe(2);
    expect(levelFor(150)).toBe(3);
    expect(levelFor(500)).toBe(5);
  });

  it('reports progress inside the level', () => {
    expect(levelProgress(0)).toEqual({ level: 1, into: 0, needed: 50 });
    expect(levelProgress(120)).toEqual({ level: 2, into: 70, needed: 100 });
    expect(levelProgress(150)).toEqual({ level: 3, into: 0, needed: 150 });
  });
});

describe('dayDiff', () => {
  it('counts whole days across month, year, and leap-day ends', () => {
    expect(dayDiff('2026-01-31', '2026-02-01')).toBe(1);
    expect(dayDiff('2025-12-31', '2026-01-01')).toBe(1);
    expect(dayDiff('2028-02-28', '2028-03-01')).toBe(2);
    expect(dayDiff('2026-03-01', '2026-03-01')).toBe(0);
    expect(dayDiff('2026-03-02', '2026-03-01')).toBe(-1);
  });

  it('is not affected by daylight saving changes', () => {
    expect(dayDiff('2026-03-28', '2026-03-30')).toBe(2);
    expect(dayDiff('2026-10-24', '2026-10-26')).toBe(2);
  });

  it('returns null for an invalid date', () => {
    expect(dayDiff('yesterday', '2026-03-01')).toBeNull();
  });
});

describe('currentStreak', () => {
  const progress = withStreak(4, 6, '2026-05-10');

  it('shows the stored streak for today and yesterday', () => {
    expect(currentStreak(progress, '2026-05-10')).toBe(4);
    expect(currentStreak(progress, '2026-05-11')).toBe(4);
  });

  it('shows 0 after a gap and for no practice', () => {
    expect(currentStreak(progress, '2026-05-12')).toBe(0);
    expect(currentStreak(EMPTY_PROGRESS, '2026-05-12')).toBe(0);
  });
});

describe('recordRun', () => {
  it('starts the streak on the first run', () => {
    const { progress, reward } = recordRun(EMPTY_PROGRESS, 'a', 1, '2026-05-10');
    expect(progress.streak).toEqual({ current: 1, best: 1, lastDay: '2026-05-10' });
    expect(reward.streak).toBe(1);
    expect(reward.newBestStreak).toBe(false);
  });

  it('keeps the streak on the same day', () => {
    const start = withStreak(3, 3, '2026-05-10');
    expect(recordRun(start, 'a', 1, '2026-05-10').progress.streak).toEqual(start.streak);
  });

  it('adds one on the next day and flags a new best', () => {
    const { progress, reward } = recordRun(withStreak(3, 3, '2026-05-10'), 'a', 1, '2026-05-11');
    expect(progress.streak).toEqual({ current: 4, best: 4, lastDay: '2026-05-11' });
    expect(reward.newBestStreak).toBe(true);
  });

  it('restarts at 1 after a gap and keeps the best', () => {
    const { progress, reward } = recordRun(withStreak(5, 7, '2026-05-10'), 'a', 1, '2026-05-13');
    expect(progress.streak).toEqual({ current: 1, best: 7, lastDay: '2026-05-13' });
    expect(reward.newBestStreak).toBe(false);
  });

  it('does not change the streak when the clock went backwards', () => {
    const start = withStreak(5, 7, '2026-05-10');
    expect(recordRun(start, 'a', 1, '2026-05-08').progress.streak).toEqual(start.streak);
  });

  it('adds XP and detects a level up', () => {
    const start: Progress = { ...EMPTY_PROGRESS, xp: 40 };
    const { progress, reward } = recordRun(start, 'a', 1, '2026-05-10');
    expect(progress.xp).toBe(65);
    expect(reward).toMatchObject({ stars: 3, xpGained: 25, levelBefore: 1, levelAfter: 2 });
  });

  it('keeps the best values and counts completions', () => {
    const first = recordRun(EMPTY_PROGRESS, 'a', 1, '2026-05-10');
    expect(first.reward.newBestAccuracy).toBe(false);
    const second = recordRun(first.progress, 'a', 0.5, '2026-05-10');
    expect(second.progress.lessons.a).toEqual({ bestAccuracy: 1, bestStars: 3, completions: 2 });
    expect(second.reward.newBestAccuracy).toBe(false);
  });

  it('flags a better accuracy after the first run', () => {
    const first = recordRun(EMPTY_PROGRESS, 'a', 0.7, '2026-05-10');
    const second = recordRun(first.progress, 'a', 0.9, '2026-05-10');
    expect(second.reward.newBestAccuracy).toBe(true);
    expect(second.progress.lessons.a).toMatchObject({ bestAccuracy: 0.9, bestStars: 2 });
  });

  it('does not change its input', () => {
    const snapshot = JSON.stringify(EMPTY_PROGRESS);
    recordRun(EMPTY_PROGRESS, 'a', 1, '2026-05-10');
    expect(JSON.stringify(EMPTY_PROGRESS)).toBe(snapshot);
  });
});

describe('parseProgress', () => {
  it('gives empty progress for null, garbage, a wrong version, or wrong types', () => {
    expect(parseProgress(null)).toEqual(EMPTY_PROGRESS);
    expect(parseProgress('not json')).toEqual(EMPTY_PROGRESS);
    expect(parseProgress('42')).toEqual(EMPTY_PROGRESS);
    expect(parseProgress('{"version":99}')).toEqual(EMPTY_PROGRESS);
    expect(parseProgress(JSON.stringify({ ...EMPTY_PROGRESS, xp: '5' }))).toEqual(EMPTY_PROGRESS);
    expect(parseProgress(JSON.stringify({ ...EMPTY_PROGRESS, xp: -5 }))).toEqual(EMPTY_PROGRESS);
  });

  it('rejects an invalid last day', () => {
    const bad = { ...EMPTY_PROGRESS, streak: { current: 1, best: 1, lastDay: 'soon' } };
    expect(parseProgress(JSON.stringify(bad))).toEqual(EMPTY_PROGRESS);
  });

  it('round-trips valid progress and keeps unknown lesson ids', () => {
    const run = recordRun(EMPTY_PROGRESS, 'future-lesson', 0.9, '2026-05-10').progress;
    expect(parseProgress(JSON.stringify(run))).toEqual(run);
  });

  it('drops invalid lesson records one by one', () => {
    const raw = JSON.stringify({
      ...EMPTY_PROGRESS,
      lessons: {
        good: { bestAccuracy: 1, bestStars: 3, completions: 1 },
        bad: { bestAccuracy: 2, bestStars: 3, completions: 1 },
        worse: { bestAccuracy: 1, bestStars: 3, completions: -1 },
      },
    });
    expect(Object.keys(parseProgress(raw).lessons)).toEqual(['good']);
  });
});
