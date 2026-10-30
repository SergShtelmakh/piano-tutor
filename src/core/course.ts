// Pure: turns the score of a library piece into a course of lessons, from the simplest to the
// hardest. Loading the piece and drawing the lessons live elsewhere (`course/`, `components/`).
import type { MessageKey } from '../i18n/locales/en.ts';
import { keyboardWindow } from './computerKeymap.ts';
import type { Hand, Lesson } from './lesson.ts';
import { evenPages, randomPicks, type RandomSource } from './lessons.ts';
import type { LibraryPiece } from './libraryCatalog.ts';
import { MAX_BASE_OCTAVE, MIN_BASE_OCTAVE } from './notes.ts';
import type { LessonRecord } from './progress.ts';
import { buildScore, measureBars, type Score, type ScoreBar } from './score.ts';
import type { Piece } from './smf.ts';
import type { Clef } from './staff.ts';

/** A part is at most this many bars and this many steps (both hands together). */
export const MAX_PART_BARS = 4;
export const MAX_PART_STEPS = 32;
/** The course covers this many parts from the start of the piece. */
export const MAX_PARTS = 6;

/** Length of a drill: twice the number of different items, within these limits. */
const NOTE_DRILL = { min: 8, max: 24 };
const CHORD_DRILL = { min: 6, max: 16 };

/** The translation key of each hand's name. */
export const HAND_KEYS: Record<Hand, MessageKey> = {
  right: 'courseHandRight',
  left: 'courseHandLeft',
  both: 'courseHandBoth',
};

const CLEFS: Record<Hand, readonly Clef[]> = {
  right: ['treble'],
  left: ['bass'],
  both: ['treble', 'bass'],
};

/** The notes that begin at the same moment, lowest first, and the time (seconds) of that moment. */
export interface CourseStep {
  notes: number[];
  time: number;
}

/**
 * The steps of a hand (or of both) in some bars, in order. A note that continues a tie is not a
 * step (it is pressed once), and rests are not steps. Steps of both hands that begin together are
 * one step.
 */
export function stepsOf(bars: readonly ScoreBar[], hand: Hand): CourseStep[] {
  const byUnit = new Map<number, { notes: Set<number>; time: number }>();
  for (const bar of bars) {
    for (const clef of CLEFS[hand]) {
      for (const column of bar.columns[clef]) {
        if (column.rest) continue;
        for (const note of column.notes) {
          if (note.tiePrev) continue;
          const step = byUnit.get(column.unit) ?? { notes: new Set<number>(), time: column.time };
          step.notes.add(note.note);
          byUnit.set(column.unit, step);
        }
      }
    }
  }
  return [...byUnit.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, step]) => ({ notes: [...step.notes].sort((a, b) => a - b), time: step.time }));
}

export interface CoursePart {
  /** From 1. */
  number: number;
  bars: readonly ScoreBar[];
  /** Bar numbers (from 1) of the first and the last bar of the part. */
  fromBar: number;
  toBar: number;
}

export interface Parts {
  parts: CoursePart[];
  /** True when the piece goes on after the last part. */
  truncated: boolean;
  /** The bar numbers the course covers, or null for a piece without notes. */
  covered: { from: number; to: number } | null;
}

function makePart(number: number, bars: ScoreBar[]): CoursePart {
  return { number, bars, fromBar: bars[0].number, toBar: bars[bars.length - 1].number };
}

/**
 * Splits the start of a piece into parts of whole bars: at most `MAX_PART_BARS` bars and
 * `MAX_PART_STEPS` steps (both hands), at least one bar. Bars with no note join the part before
 * (or the first part). At most `MAX_PARTS` parts are made.
 */
export function splitParts(score: Score): Parts {
  const parts: CoursePart[] = [];
  let current: ScoreBar[] = [];
  let currentSteps = 0;
  let truncated = false;

  for (const bar of score.bars) {
    const steps = stepsOf([bar], 'both').length;
    if (current.length === 0) {
      current = [bar];
      currentSteps = steps;
    } else if (
      steps === 0 ||
      (current.length < MAX_PART_BARS && currentSteps + steps <= MAX_PART_STEPS)
    ) {
      current.push(bar);
      currentSteps += steps;
    } else {
      parts.push(makePart(parts.length + 1, current));
      if (parts.length === MAX_PARTS) {
        truncated = true;
        current = [];
        break;
      }
      current = [bar];
      currentSteps = steps;
    }
  }
  if (current.length > 0) parts.push(makePart(parts.length + 1, current));

  return {
    parts,
    truncated,
    covered: parts.length ? { from: parts[0].fromBar, to: parts[parts.length - 1].toBar } : null,
  };
}

/** A score made of some of the bars of another score. */
export function notationOf(bars: readonly ScoreBar[]): Score {
  const notes = bars.flatMap((bar) =>
    (['treble', 'bass'] as const).flatMap((clef) =>
      bar.columns[clef].flatMap((column) => column.notes.map((note) => note.note)),
    ),
  );
  return {
    bars: [...bars],
    low: notes.length ? Math.min(...notes) : 60,
    high: notes.length ? Math.max(...notes) : 60,
    ...measureBars(bars),
  };
}

const QUARTER_TICKS = 480;
const QUARTER_SECONDS = 0.5; // 120 bpm

/**
 * The notation of a drill: every step is a quarter note (a chord is one column), in 4/4 bars. The
 * time of step `i` in the returned score is `i * 0.5`. Notes are written by the key signature `fifths`
 * (the key at the start of the piece).
 */
export function drillNotation(
  steps: readonly (readonly number[])[],
  fifths = 0,
): {
  score: Score;
  stepTimes: number[];
} {
  const piece: Piece = {
    ticksPerQuarter: QUARTER_TICKS,
    notes: steps.flatMap((step, i) =>
      step.map((note) => ({
        note,
        startTick: i * QUARTER_TICKS,
        endTick: (i + 1) * QUARTER_TICKS,
        start: i * QUARTER_SECONDS,
        end: (i + 1) * QUARTER_SECONDS,
        velocity: 80,
      })),
    ),
    pedal: [],
    tempos: [{ tick: 0, time: 0, microsPerQuarter: 500_000 }],
    timeSignatures: [{ tick: 0, numerator: 4, denominator: 4 }],
    keySignatures: [{ tick: 0, fifths }],
    duration: steps.length * QUARTER_SECONDS,
  };
  return { score: buildScore(piece), stepTimes: steps.map((_, i) => i * QUARTER_SECONDS) };
}

/**
 * The base octave whose computer-keyboard window holds the most of `notes`. Among equals, the
 * window centred nearest to the middle of the notes wins.
 */
export function baseOctaveFor(notes: readonly number[]): number {
  if (notes.length === 0) return MIN_BASE_OCTAVE;
  const sorted = [...notes].sort((a, b) => a - b);
  const middle = (sorted[0] + sorted[sorted.length - 1]) / 2;
  let best = { octave: MIN_BASE_OCTAVE, count: -1, distance: Infinity };
  for (let octave = MIN_BASE_OCTAVE; octave <= MAX_BASE_OCTAVE; octave++) {
    const { low, high } = keyboardWindow(octave);
    const count = sorted.filter((note) => note >= low && note <= high).length;
    const distance = Math.abs((low + high) / 2 - middle);
    if (count > best.count || (count === best.count && distance < best.distance)) {
      best = { octave, count, distance };
    }
  }
  return best.octave;
}

/**
 * The merges of neighbouring parts: pairs first, then pairs of pairs, until everything is
 * together. `[1..6]` gives `[1,2] [3,4] [5,6] [1..4] [1..6]`. A leftover part moves up unchanged.
 */
export function mergeGroups(numbers: readonly number[]): number[][] {
  const merges: number[][] = [];
  let level: number[][] = numbers.map((number) => [number]);
  while (level.length > 1) {
    const next: number[][] = [];
    for (let i = 0; i < level.length; i += 2) {
      if (i + 1 < level.length) {
        const merged = [...level[i], ...level[i + 1]];
        merges.push(merged);
        next.push(merged);
      } else {
        next.push(level[i]);
      }
    }
    level = next;
  }
  return merges;
}

export type CourseLessonKind = 'notes' | 'chords' | 'part' | 'merge';

export interface CourseLesson {
  /** Stable: the learner's results are saved under it. */
  id: string;
  kind: CourseLessonKind;
  hand: Hand;
  /** The number of steps (for a drill, its length). */
  stepCount: number;
  titleKey: MessageKey;
  titleParams?: Readonly<Record<string, string | number>>;
  /** A drill gets a new random order each time; part and merge lessons are always the same. */
  create: (random: RandomSource) => Lesson;
}

export interface CourseStage {
  hand: Hand;
  lessons: CourseLesson[];
}

export interface Course {
  pieceId: string;
  pieceTitle: string;
  totalBars: number;
  covered: { from: number; to: number } | null;
  truncated: boolean;
  stages: CourseStage[];
}

/** `melody:<piece id>:<hand>:<kind>[-<n>]`, for example `melody:bach/bwv-515-aria:right:part-2`. */
export function lessonId(pieceId: string, hand: Hand, kind: CourseLessonKind, n?: string): string {
  return `melody:${pieceId}:${hand}:${n ? `${kind}-${n}` : kind}`;
}

const ID_PATTERN = /^melody:(.+):(?:right|left|both):[a-z]+(?:-[0-9-]+)?$/;

/** The piece a course lesson id belongs to, or null for any other lesson id. */
export function pieceIdOfLesson(id: string): string | null {
  return ID_PATTERN.exec(id)?.[1] ?? null;
}

function clamp(value: number, { min, max }: { min: number; max: number }): number {
  return Math.min(max, Math.max(min, value));
}

function lessonFrom(
  base: Pick<CourseLesson, 'id' | 'hand' | 'titleKey' | 'titleParams'>,
  pieceTitle: string,
  steps: readonly (readonly number[])[],
  notation: { score: Score; stepTimes: readonly number[] },
): Lesson {
  return {
    id: base.id,
    titleKey: base.titleKey,
    titleParams: base.titleParams,
    hand: base.hand,
    pieceTitle,
    baseOctave: baseOctaveFor(steps.flat()),
    steps,
    pages: evenPages(steps.length),
    notation,
  };
}

/** The lessons that play the steps of some parts in order (a part lesson or a merge lesson). */
function playLesson(
  kind: 'part' | 'merge',
  hand: Hand,
  pieceId: string,
  pieceTitle: string,
  parts: readonly CoursePart[],
): CourseLesson {
  const first = parts[0];
  const last = parts[parts.length - 1];
  const bars = parts.flatMap((part) => part.bars);
  const steps = stepsOf(bars, hand);
  const isPart = kind === 'part';
  const titleParams: Readonly<Record<string, string | number>> = isPart
    ? { part: first.number, from: first.fromBar, to: last.toBar }
    : { from: first.number, to: last.number };
  const base = {
    id: lessonId(
      pieceId,
      hand,
      kind,
      isPart ? String(first.number) : `${first.number}-${last.number}`,
    ),
    hand,
    titleKey: isPart ? ('courseLessonPart' as const) : ('courseLessonMerge' as const),
    titleParams,
  };
  return {
    ...base,
    kind,
    stepCount: steps.length,
    create: () =>
      lessonFrom(
        base,
        pieceTitle,
        steps.map((step) => step.notes),
        { score: notationOf(bars), stepTimes: steps.map((step) => step.time) },
      ),
  };
}

function drillLesson(
  kind: 'notes' | 'chords',
  hand: Hand,
  pieceId: string,
  pieceTitle: string,
  pool: readonly (readonly number[])[],
  fifths: number,
): CourseLesson {
  const limits = kind === 'notes' ? NOTE_DRILL : CHORD_DRILL;
  const length = clamp(pool.length * 2, limits);
  const base = {
    id: lessonId(pieceId, hand, kind),
    hand,
    titleKey: kind === 'notes' ? ('courseLessonNotes' as const) : ('courseLessonChords' as const),
  };
  return {
    ...base,
    kind,
    stepCount: length,
    create: (random) => {
      const steps = randomPicks(pool, length, random, (step) => step.join(','));
      return lessonFrom(base, pieceTitle, steps, drillNotation(steps, fifths));
    },
  };
}

function distinct(steps: readonly (readonly number[])[]): number[][] {
  const seen = new Map<string, number[]>();
  for (const step of steps) seen.set(step.join(','), [...step]);
  return [...seen.values()].sort((a, b) => a[0] - b[0] || a.length - b.length);
}

/** One hand's stage: read the notes, chords (if any), the parts, then the merges. */
function handStage(
  hand: 'right' | 'left',
  parts: readonly CoursePart[],
  piece: { id: string; title: string },
  fifths: number,
): CourseStage | null {
  const mine = parts.filter((part) => stepsOf(part.bars, hand).length > 0);
  if (mine.length === 0) return null;

  const allSteps = mine.flatMap((part) => stepsOf(part.bars, hand).map((step) => step.notes));
  const pitches = distinct(allSteps.flatMap((step) => step.map((note) => [note])));
  const chords = distinct(allSteps.filter((step) => step.length >= 2));

  const lessons: CourseLesson[] = [];
  // A drill needs two different items, or it would have to repeat the same one.
  if (pitches.length >= 2)
    lessons.push(drillLesson('notes', hand, piece.id, piece.title, pitches, fifths));
  if (chords.length >= 2)
    lessons.push(drillLesson('chords', hand, piece.id, piece.title, chords, fifths));
  for (const part of mine) lessons.push(playLesson('part', hand, piece.id, piece.title, [part]));
  for (const group of mergeGroups(mine.map((part) => part.number))) {
    const members = mine.filter((part) => group.includes(part.number));
    lessons.push(playLesson('merge', hand, piece.id, piece.title, members));
  }
  return { hand, lessons };
}

/** The course of a piece: its stages and lessons, in the order they should be learned. */
export function buildCourse(score: Score, piece: { id: string; title: string }): Course {
  const { parts, truncated, covered } = splitParts(score);
  const stages: CourseStage[] = [];

  const fifths = score.bars[0]?.keySignature ?? 0; // the key at the start of the piece
  const right = handStage('right', parts, piece, fifths);
  const left = handStage('left', parts, piece, fifths);
  if (right) stages.push(right);
  if (left) stages.push(left);

  // "Both hands" only makes sense when each hand has something to play.
  if (right && left) {
    const lessons = parts.map((part) => playLesson('part', 'both', piece.id, piece.title, [part]));
    for (const group of mergeGroups(parts.map((part) => part.number))) {
      lessons.push(
        playLesson(
          'merge',
          'both',
          piece.id,
          piece.title,
          parts.filter((part) => group.includes(part.number)),
        ),
      );
    }
    stages.push({ hand: 'both', lessons });
  }

  return {
    pieceId: piece.id,
    pieceTitle: piece.title,
    totalBars: score.bars.length,
    covered,
    truncated,
    stages,
  };
}

export function courseLessons(course: Course): CourseLesson[] {
  return course.stages.flatMap((stage) => stage.lessons);
}

function isFinished(records: Readonly<Record<string, LessonRecord>>, id: string): boolean {
  return (records[id]?.completions ?? 0) > 0;
}

/** How many lessons of the course have at least one finished run. */
export function finishedLessons(
  course: Course,
  records: Readonly<Record<string, LessonRecord>>,
): number {
  return courseLessons(course).filter((lesson) => isFinished(records, lesson.id)).length;
}

/**
 * The library pieces that have at least one finished course lesson, with the number of finished
 * lessons: most first, then by title.
 */
export function piecesInProgress(
  records: Readonly<Record<string, LessonRecord>>,
  pieces: readonly LibraryPiece[],
): { piece: LibraryPiece; finished: number }[] {
  const counts = new Map<string, number>();
  for (const id of Object.keys(records)) {
    const pieceId = pieceIdOfLesson(id);
    if (pieceId !== null && isFinished(records, id))
      counts.set(pieceId, (counts.get(pieceId) ?? 0) + 1);
  }
  return pieces
    .flatMap((piece) => (counts.has(piece.id) ? [{ piece, finished: counts.get(piece.id)! }] : []))
    .sort((a, b) => b.finished - a.finished || a.piece.title.localeCompare(b.piece.title, 'en'));
}
