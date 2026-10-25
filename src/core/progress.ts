// Pure scoring and progress rules: stars, XP, levels, daily streak, saved-data parsing.
// No React, DOM, storage, or clock access: "today" is passed in as a local `YYYY-MM-DD` string.

export type Stars = 0 | 1 | 2 | 3;

export interface LessonRecord {
  /** Best accuracy of any finished run, 0 to 1. */
  bestAccuracy: number;
  bestStars: Stars;
  completions: number;
}

export interface Streak {
  current: number;
  best: number;
  /** Local day (`YYYY-MM-DD`) of the last finished run. */
  lastDay: string | null;
}

export interface Progress {
  version: 1;
  xp: number;
  streak: Streak;
  lessons: Record<string, LessonRecord>;
}

export interface RunReward {
  stars: Stars;
  xpGained: number;
  levelBefore: number;
  levelAfter: number;
  /** The streak after this run. */
  streak: number;
  newBestStreak: boolean;
  newBestAccuracy: boolean;
}

export const EMPTY_PROGRESS: Progress = {
  version: 1,
  xp: 0,
  streak: { current: 0, best: 0, lastDay: null },
  lessons: {},
};

export const MAX_STARS = 3;

/** Stars for a finished run: 1 for any finish, 2 from 80 %, 3 from 95 %. Compares the exact ratio. */
export function starsFor(accuracy: number): Stars {
  if (accuracy >= 0.95) return 3;
  if (accuracy >= 0.8) return 2;
  return 1;
}

export function xpFor(stars: Stars): number {
  return 10 + 5 * stars;
}

/** Total XP needed to reach `level` (level 1 needs 0). */
export function xpForLevel(level: number): number {
  return 25 * level * (level - 1);
}

export function levelFor(xp: number): number {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  return level;
}

/** XP gathered inside the current level and the XP that level needs, for a progress bar. */
export function levelProgress(xp: number): { level: number; into: number; needed: number } {
  const level = levelFor(xp);
  const start = xpForLevel(level);
  return { level, into: xp - start, needed: xpForLevel(level + 1) - start };
}

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

function dayNumber(day: string): number | null {
  const match = DAY.exec(day);
  if (!match) return null;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / 86_400_000;
}

/** Whole days from `from` to `to` (negative when `to` is earlier); null for an invalid date. */
export function dayDiff(from: string, to: string): number | null {
  const a = dayNumber(from);
  const b = dayNumber(to);
  return a === null || b === null ? null : Math.round(b - a);
}

/** The streak to show today: the stored one if the last day is today or yesterday, else 0. */
export function currentStreak(progress: Progress, today: string): number {
  const { lastDay, current } = progress.streak;
  if (lastDay === null) return 0;
  const diff = dayDiff(lastDay, today);
  return diff !== null && diff <= 1 ? current : 0;
}

function nextStreak(streak: Streak, today: string): Streak {
  if (streak.lastDay === null)
    return { current: 1, best: Math.max(streak.best, 1), lastDay: today };
  const diff = dayDiff(streak.lastDay, today);
  // Clock went backwards (or the saved day is invalid): keep the streak as it is.
  if (diff === null || diff < 0) return streak;
  if (diff === 0) return streak;
  const current = diff === 1 ? streak.current + 1 : 1;
  return { current, best: Math.max(streak.best, current), lastDay: today };
}

/** Applies one finished run. Returns new objects; the input is not changed. */
export function recordRun(
  progress: Progress,
  lessonId: string,
  accuracy: number,
  today: string,
): { progress: Progress; reward: RunReward } {
  const stars = starsFor(accuracy);
  const xpGained = xpFor(stars);
  const xp = progress.xp + xpGained;
  const streak = nextStreak(progress.streak, today);

  const previous = progress.lessons[lessonId];
  const record: LessonRecord = previous
    ? {
        bestAccuracy: Math.max(previous.bestAccuracy, accuracy),
        bestStars: Math.max(previous.bestStars, stars) as Stars,
        completions: previous.completions + 1,
      }
    : { bestAccuracy: accuracy, bestStars: stars, completions: 1 };

  return {
    progress: { ...progress, xp, streak, lessons: { ...progress.lessons, [lessonId]: record } },
    reward: {
      stars,
      xpGained,
      levelBefore: levelFor(progress.xp),
      levelAfter: levelFor(xp),
      streak: streak.current,
      newBestStreak: streak.best > progress.streak.best && streak.best > 1,
      newBestAccuracy: previous !== undefined && accuracy > previous.bestAccuracy,
    },
  };
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function parseRecord(value: unknown): LessonRecord | null {
  if (typeof value !== 'object' || value === null) return null;
  const { bestAccuracy, bestStars, completions } = value as Record<string, unknown>;
  if (typeof bestAccuracy !== 'number' || !(bestAccuracy >= 0 && bestAccuracy <= 1)) return null;
  if (bestStars !== 0 && bestStars !== 1 && bestStars !== 2 && bestStars !== 3) return null;
  if (!isCount(completions)) return null;
  return { bestAccuracy, bestStars, completions };
}

/** Parses the saved JSON. Anything invalid gives empty progress; bad lesson records are dropped. */
export function parseProgress(raw: string | null): Progress {
  if (raw === null) return EMPTY_PROGRESS;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return EMPTY_PROGRESS;
  }
  if (typeof data !== 'object' || data === null) return EMPTY_PROGRESS;
  const { version, xp, streak, lessons } = data as Record<string, unknown>;
  if (version !== 1 || !isCount(xp)) return EMPTY_PROGRESS;
  if (typeof streak !== 'object' || streak === null) return EMPTY_PROGRESS;
  const { current, best, lastDay } = streak as Record<string, unknown>;
  if (!isCount(current) || !isCount(best)) return EMPTY_PROGRESS;
  if (lastDay !== null && (typeof lastDay !== 'string' || dayNumber(lastDay) === null)) {
    return EMPTY_PROGRESS;
  }
  if (typeof lessons !== 'object' || lessons === null || Array.isArray(lessons)) {
    return EMPTY_PROGRESS;
  }

  const parsedLessons: Record<string, LessonRecord> = {};
  for (const [id, value] of Object.entries(lessons)) {
    const record = parseRecord(value);
    if (record) parsedLessons[id] = record;
  }
  return {
    version: 1,
    xp,
    streak: { current, best: Math.max(best, current), lastDay },
    lessons: parsedLessons,
  };
}
