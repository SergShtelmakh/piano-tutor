// The lessons that ship with the app. Pure: the random source is passed in.
import type { MessageKey } from '../i18n/locales/en.ts';
import type { Lesson } from './lesson.ts';

/** White keys B3 C4 D4 E4 F4 G4 A4 B4 C5: one note on the bass staff, the rest on the treble staff. */
export const NOTE_READING_POOL: readonly number[] = [59, 60, 62, 64, 65, 67, 69, 71, 72];

export const NOTE_READING_LENGTH = 20;

/** A number in [0, 1), like `Math.random`. */
export type RandomSource = () => number;

/**
 * `length` notes drawn at random from `pool`. The same note never comes twice in a row: each
 * step picks from the pool without the previous note.
 */
export function randomSequence(
  pool: readonly number[],
  length: number,
  random: RandomSource,
): number[] {
  if (length > 1 && new Set(pool).size < 2) {
    throw new RangeError('A pool of at least two different notes is needed for a sequence');
  }
  const sequence: number[] = [];
  for (let i = 0; i < length; i++) {
    const previous = sequence[i - 1];
    const candidates = pool.filter((note) => note !== previous);
    // The clamp keeps a source that returns exactly 1 from running past the end.
    const index = Math.min(Math.floor(random() * candidates.length), candidates.length - 1);
    sequence.push(candidates[index]);
  }
  return sequence;
}

/** Note reading: a new random order of single notes every time it is created. */
export function createNoteReadingLesson(random: RandomSource): Lesson {
  return {
    id: 'note-reading',
    titleKey: 'lessonNoteReadingTitle',
    baseOctave: 4,
    steps: randomSequence(NOTE_READING_POOL, NOTE_READING_LENGTH, random).map((note) => [note]),
  };
}

export interface LessonEntry {
  id: string;
  titleKey: MessageKey;
  create: (random: RandomSource) => Lesson;
}

/** Every lesson the Home screen offers, in display order. */
export const LESSON_CATALOG: readonly LessonEntry[] = [
  { id: 'note-reading', titleKey: 'lessonNoteReadingTitle', create: createNoteReadingLesson },
];
