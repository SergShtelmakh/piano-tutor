// Pure: the rules behind the lesson controls: tempo, what Listen plays, practising one hand of a
// both-hands lesson, and the saved settings. No React, DOM, audio, storage, or timers: the
// adapters in `src/lesson/` run the schedules this module computes.
import { baseOctaveFor } from './course.ts';
import type { Lesson } from './lesson.ts';
import { evenPages } from './lessons.ts';
import { UNITS_PER_QUARTER } from './score.ts';

export const TEMPO = { min: 40, max: 200, step: 5, default: 80 } as const;

/** The nearest allowed tempo (a multiple of the step within the range); the default for junk. */
export function clampTempo(bpm: number): number {
  if (!Number.isFinite(bpm)) return TEMPO.default;
  const snapped = Math.round(bpm / TEMPO.step) * TEMPO.step;
  return Math.min(TEMPO.max, Math.max(TEMPO.min, snapped));
}

export function stepTempo(bpm: number, direction: 1 | -1): number {
  return clampTempo(clampTempo(bpm) + direction * TEMPO.step);
}

/** One beat (a quarter note) at `bpm`. */
export function beatSeconds(bpm: number): number {
  return 60 / clampTempo(bpm);
}

/** One sixteenth of the piece at `bpm`. */
export function secondsPerUnit(bpm: number): number {
  return beatSeconds(bpm) / UNITS_PER_QUARTER;
}

/** Notes to start at `at` seconds after the start of a schedule. */
export interface TimedChunk {
  notes: readonly number[];
  at: number;
}

/** Where a step starts, in sixteenths: its place in the piece, or one beat per step. */
function unitOf(lesson: Pick<Lesson, 'stepUnits'>, index: number): number {
  return lesson.stepUnits?.[index] ?? index * UNITS_PER_QUARTER;
}

/**
 * What Listen plays: the steps from `from` up to (not including) `to`, every note of each step, at
 * the rhythm of the piece (or one step per beat for a lesson without one).
 */
export function listenChunks(lesson: Lesson, from: number, to: number, bpm: number): TimedChunk[] {
  const end = Math.min(to, lesson.steps.length);
  const start = Math.max(0, from);
  const chunks: TimedChunk[] = [];
  const origin = unitOf(lesson, start);
  const perUnit = secondsPerUnit(bpm);
  for (let index = start; index < end; index++) {
    chunks.push({ notes: lesson.steps[index], at: (unitOf(lesson, index) - origin) * perUnit });
  }
  return chunks;
}

export type PracticeHand = 'right' | 'left';

/** Which hands a lesson can be practised with: a both-hands lesson where that hand has notes. */
export function practiceHands(lesson: Lesson): Record<PracticeHand, boolean> {
  const hands = lesson.stepHands;
  return {
    right: hands !== undefined && hands.right.some((notes) => notes.length > 0),
    left: hands !== undefined && hands.left.some((notes) => notes.length > 0),
  };
}

/** The other hand's notes to play after a step is done, `offsetUnits` after the step began. */
export interface AccompanimentChunk {
  notes: readonly number[];
  offsetUnits: number;
}

export interface OneHandLesson {
  /** The lesson as one hand plays it: only that hand's notes, steps without any dropped. */
  lesson: Lesson;
  /** The index in the full lesson of each step of `lesson`. */
  sourceIndex: readonly number[];
  /** For each step of `lesson`: what the app plays when the learner finishes it. */
  accompaniment: readonly (readonly AccompanimentChunk[])[];
}

/**
 * A both-hands lesson as one hand plays it. When a step is done, the app plays the other hand's
 * notes of that step (those the learner didn't play), then the other hand's steps that were
 * dropped after it, up to the next step of the learner. Other-hand steps before the first step of
 * the learner are not played. Returns null for a lesson that has no hands to split.
 */
export function oneHandLesson(lesson: Lesson, hand: PracticeHand): OneHandLesson | null {
  const hands = lesson.stepHands;
  if (!hands) return null;
  const mine = hands[hand];
  const other = hands[hand === 'right' ? 'left' : 'right'];

  const kept: number[] = [];
  mine.forEach((notes, index) => {
    if (notes.length > 0) kept.push(index);
  });

  const accompaniment = kept.map((index, k) => {
    const next = kept[k + 1] ?? lesson.steps.length;
    const chunks: AccompanimentChunk[] = [];
    const own = other[index].filter((note) => !mine[index].includes(note));
    if (own.length > 0) chunks.push({ notes: own, offsetUnits: 0 });
    for (let skipped = index + 1; skipped < next; skipped++) {
      if (other[skipped].length > 0) {
        chunks.push({
          notes: other[skipped],
          offsetUnits: unitOf(lesson, skipped) - unitOf(lesson, index),
        });
      }
    }
    return chunks;
  });

  const steps = kept.map((index) => mine[index]);
  return {
    lesson: {
      ...lesson,
      steps,
      pages: evenPages(steps.length),
      baseOctave: baseOctaveFor(steps.flat()),
      stepUnits: kept.map((index) => unitOf(lesson, index)),
      stepHands: undefined,
      notation: lesson.notation && {
        ...lesson.notation,
        stepTimes: kept.map((index) => lesson.notation!.stepTimes[index]),
      },
    },
    sourceIndex: kept,
    accompaniment,
  };
}

export const LESSON_SETTINGS_VERSION = 1;

export interface LessonSettings {
  /** Beats (quarter notes) per minute, for Listen, the other hand, and the metronome. */
  tempo: number;
  metronome: boolean;
  /** A ring on the key(s) to play now. */
  hint: boolean;
}

export const DEFAULT_LESSON_SETTINGS: LessonSettings = {
  tempo: TEMPO.default,
  metronome: false,
  hint: false,
};

/** Reads the saved settings; anything invalid falls back to the default, field by field. */
export function parseLessonSettings(text: string | null): LessonSettings {
  if (!text) return DEFAULT_LESSON_SETTINGS;
  try {
    const data: unknown = JSON.parse(text);
    if (typeof data !== 'object' || data === null) return DEFAULT_LESSON_SETTINGS;
    const record = data as Record<string, unknown>;
    if (record.version !== LESSON_SETTINGS_VERSION) return DEFAULT_LESSON_SETTINGS;
    return {
      tempo: typeof record.tempo === 'number' ? clampTempo(record.tempo) : TEMPO.default,
      metronome: record.metronome === true,
      hint: record.hint === true,
    };
  } catch {
    return DEFAULT_LESSON_SETTINGS;
  }
}

export function serialiseLessonSettings(settings: LessonSettings): string {
  return JSON.stringify({ version: LESSON_SETTINGS_VERSION, ...settings });
}
