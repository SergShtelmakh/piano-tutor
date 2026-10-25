// The lessons that ship with the app. Pure: the random source is passed in.
import type { MessageKey } from '../i18n/locales/en.ts';
import type { Lesson } from './lesson.ts';

/** White keys B3 C4 D4 E4 F4 G4 A4 B4 C5: one note on the bass staff, the rest on the treble staff. */
export const NOTE_READING_POOL: readonly number[] = [59, 60, 62, 64, 65, 67, 69, 71, 72];

export const NOTE_READING_LENGTH = 20;

/** Steps in a chord or interval lesson. */
export const CHORD_LESSON_LENGTH = 12;

/** The most steps the staff shows at once. */
export const MAX_PAGE_STEPS = 8;

/** A number in [0, 1), like `Math.random`. */
export type RandomSource = () => number;

/**
 * `length` items drawn at random from `pool`. The same item (same `key`) never comes twice in a
 * row: each step picks from the pool without the previous item.
 */
export function randomPicks<T>(
  pool: readonly T[],
  length: number,
  random: RandomSource,
  key: (item: T) => string,
): T[] {
  if (length > 1 && new Set(pool.map(key)).size < 2) {
    throw new RangeError('A pool of at least two different items is needed for a sequence');
  }
  const picks: T[] = [];
  for (let i = 0; i < length; i++) {
    const previous = i > 0 ? key(picks[i - 1]) : null;
    const candidates = pool.filter((item) => key(item) !== previous);
    // The clamp keeps a source that returns exactly 1 from running past the end.
    const index = Math.min(Math.floor(random() * candidates.length), candidates.length - 1);
    picks.push(candidates[index]);
  }
  return picks;
}

/** `length` notes drawn at random from `pool`, never the same note twice in a row. */
export function randomSequence(
  pool: readonly number[],
  length: number,
  random: RandomSource,
): number[] {
  return randomPicks(pool, length, random, String);
}

/** Splits `total` steps into as few pages of at most `max` steps as possible, as even as possible. */
export function evenPages(total: number, max: number = MAX_PAGE_STEPS): number[] {
  if (total <= 0) return [];
  const count = Math.ceil(total / max);
  const base = Math.floor(total / count);
  const extra = total % count;
  return Array.from({ length: count }, (_, i) => (i < extra ? base + 1 : base));
}

interface LessonBase {
  id: string;
  titleKey: MessageKey;
  baseOctave: number;
}

/** Random single notes from `pool`, a new order every time. */
function randomNotesLesson(
  base: LessonBase,
  pool: readonly number[],
  random: RandomSource,
): Lesson {
  const steps = randomSequence(pool, NOTE_READING_LENGTH, random).map((note) => [note]);
  return { ...base, steps, pages: evenPages(steps.length) };
}

/** Random steps of several notes (intervals, chords) from a fixed pool of note groups. */
function randomGroupsLesson(
  base: LessonBase,
  pool: readonly (readonly number[])[],
  random: RandomSource,
): Lesson {
  const steps = randomPicks(pool, CHORD_LESSON_LENGTH, random, (group) => group.join(','));
  return { ...base, steps, pages: evenPages(steps.length) };
}

/** A fixed tune: single notes, one page per phrase. */
function melodyLesson(base: LessonBase, phrases: readonly (readonly number[])[]): Lesson {
  return {
    ...base,
    steps: phrases.flat().map((note) => [note]),
    pages: phrases.map((phrase) => phrase.length),
  };
}

/** White keys from C4 up; used to write tunes as letters. */
const LETTER_NOTES: Readonly<Record<string, number>> = {
  C: 60,
  D: 62,
  E: 64,
  F: 65,
  G: 67,
  A: 69,
  B: 71,
};

/** Turns phrases written as letters (`'EDCD'`, from C4) into note numbers, moved by `shift` semitones. */
export function tune(phrases: readonly string[], shift = 0): number[][] {
  return phrases.map((phrase) => [...phrase].map((letter) => LETTER_NOTES[letter] + shift));
}

export const MARY_PHRASES = ['EDCDEEE', 'DDDEGG', 'EDCDEEEE', 'DDEDC'];
export const ODE_PHRASES = ['EEFGGFED', 'CCDEEDD', 'EEFGGFED', 'CCDEDCC'];
export const TWINKLE_PHRASES = ['CCGGAAG', 'FFEEDDC', 'GGFFEED', 'GGFFEED', 'CCGGAAG', 'FFEEDDC'];

const TREBLE_C_G = [60, 62, 64, 65, 67];
const TREBLE_G_E = [67, 69, 71, 72, 74, 76];
const BASS_C_G = [48, 50, 52, 53, 55];
const BASS_OCTAVE = [47, 48, 50, 52, 53, 55, 57, 59];
const BOTH_CLEFS = [48, 50, 52, 53, 55, 57, 59, 60, 62, 64];

/** Every pair of white keys from C4 to C5, a second up to an octave apart (lower note first). */
export const INTERVAL_POOL: readonly (readonly number[])[] = (() => {
  const white = [60, 62, 64, 65, 67, 69, 71, 72];
  const pairs: number[][] = [];
  for (let i = 0; i < white.length; i++) {
    for (let j = i + 1; j < white.length; j++) pairs.push([white[i], white[j]]);
  }
  return pairs;
})();

const C_MAJOR = [60, 64, 67];
const D_MINOR = [62, 65, 69];
const E_MINOR = [64, 67, 71];
const F_MAJOR = [65, 69, 72];
const G_MAJOR = [67, 71, 74];
const A_MINOR = [69, 72, 76];

export const MAJOR_CHORDS = [C_MAJOR, F_MAJOR, G_MAJOR];
export const ALL_CHORDS = [C_MAJOR, D_MINOR, E_MINOR, F_MAJOR, G_MAJOR, A_MINOR];

/** Note reading: a new random order of single notes every time it is created. */
export function createNoteReadingLesson(random: RandomSource): Lesson {
  return randomNotesLesson(
    { id: 'note-reading', titleKey: 'lessonNoteReadingTitle', baseOctave: 4 },
    NOTE_READING_POOL,
    random,
  );
}

export interface LessonEntry {
  id: string;
  titleKey: MessageKey;
  create: (random: RandomSource) => Lesson;
}

export interface LessonUnit {
  id: string;
  titleKey: MessageKey;
  lessons: readonly LessonEntry[];
}

function notes(base: LessonBase, pool: readonly number[]): LessonEntry {
  return {
    id: base.id,
    titleKey: base.titleKey,
    create: (random) => randomNotesLesson(base, pool, random),
  };
}

function groups(base: LessonBase, pool: readonly (readonly number[])[]): LessonEntry {
  return {
    id: base.id,
    titleKey: base.titleKey,
    create: (random) => randomGroupsLesson(base, pool, random),
  };
}

function melody(base: LessonBase, phrases: readonly (readonly number[])[]): LessonEntry {
  return { id: base.id, titleKey: base.titleKey, create: () => melodyLesson(base, phrases) };
}

/** The curriculum, in display order. */
export const LESSON_UNITS: readonly LessonUnit[] = [
  {
    id: 'treble',
    titleKey: 'unitTrebleTitle',
    lessons: [
      notes({ id: 'treble-c-g', titleKey: 'lessonTrebleCGTitle', baseOctave: 4 }, TREBLE_C_G),
      { id: 'note-reading', titleKey: 'lessonNoteReadingTitle', create: createNoteReadingLesson },
      notes({ id: 'treble-g-e', titleKey: 'lessonTrebleGETitle', baseOctave: 4 }, TREBLE_G_E),
    ],
  },
  {
    id: 'bass',
    titleKey: 'unitBassTitle',
    lessons: [
      notes({ id: 'bass-c-g', titleKey: 'lessonBassCGTitle', baseOctave: 3 }, BASS_C_G),
      notes({ id: 'bass-octave', titleKey: 'lessonBassOctaveTitle', baseOctave: 3 }, BASS_OCTAVE),
    ],
  },
  {
    id: 'both',
    titleKey: 'unitBothTitle',
    lessons: [
      notes({ id: 'both-clefs', titleKey: 'lessonBothClefsTitle', baseOctave: 3 }, BOTH_CLEFS),
    ],
  },
  {
    id: 'melodies',
    titleKey: 'unitMelodiesTitle',
    lessons: [
      melody(
        { id: 'melody-mary', titleKey: 'lessonMelodyMaryTitle', baseOctave: 4 },
        tune(MARY_PHRASES),
      ),
      melody(
        { id: 'melody-ode', titleKey: 'lessonMelodyOdeTitle', baseOctave: 4 },
        tune(ODE_PHRASES),
      ),
      melody(
        { id: 'melody-twinkle', titleKey: 'lessonMelodyTwinkleTitle', baseOctave: 4 },
        tune(TWINKLE_PHRASES),
      ),
      melody(
        { id: 'melody-ode-left', titleKey: 'lessonMelodyOdeLeftTitle', baseOctave: 3 },
        tune(ODE_PHRASES, -12),
      ),
    ],
  },
  {
    id: 'chords',
    titleKey: 'unitChordsTitle',
    lessons: [
      groups({ id: 'intervals', titleKey: 'lessonIntervalsTitle', baseOctave: 4 }, INTERVAL_POOL),
      groups(
        { id: 'chords-major', titleKey: 'lessonChordsMajorTitle', baseOctave: 4 },
        MAJOR_CHORDS,
      ),
      groups({ id: 'chords-all', titleKey: 'lessonChordsAllTitle', baseOctave: 4 }, ALL_CHORDS),
    ],
  },
];

/** Every lesson the Home screen offers, in display order. */
export const LESSON_CATALOG: readonly LessonEntry[] = LESSON_UNITS.flatMap((unit) => unit.lessons);

/** The first lesson (in catalog order) without a finished run, or null when all have one. */
export function nextLessonId(
  catalog: readonly LessonEntry[],
  records: Readonly<Record<string, unknown>>,
): string | null {
  return catalog.find((item) => records[item.id] === undefined)?.id ?? null;
}

/** True when some step asks for more than one note. */
export function hasChords(lesson: Lesson): boolean {
  return lesson.steps.some((step) => step.length > 1);
}
