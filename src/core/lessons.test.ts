import { describe, expect, it } from 'vitest';
import { keyboardWindow } from './computerKeymap.ts';
import { isBlackKey } from './notes.ts';
import {
  INTERVAL_POOL,
  LESSON_CATALOG,
  LESSON_UNITS,
  NOTE_READING_LENGTH,
  NOTE_READING_POOL,
  createNoteReadingLesson,
  evenPages,
  hasChords,
  nextLessonId,
  randomSequence,
  type RandomSource,
} from './lessons.ts';

/** A small deterministic generator (mulberry32), so these tests never flake. */
function seeded(seed: number): RandomSource {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const constant =
  (value: number): RandomSource =>
  () =>
    value;

describe('note reading pool', () => {
  it('is the nine white keys from B3 to C5', () => {
    expect(NOTE_READING_POOL).toEqual([59, 60, 62, 64, 65, 67, 69, 71, 72]);
  });
});

describe('randomSequence', () => {
  it('follows the random source', () => {
    // 0 always picks the first candidate that is not the previous note.
    expect(randomSequence([1, 2, 3], 4, constant(0))).toEqual([1, 2, 1, 2]);
    // The highest value picks the last candidate.
    expect(randomSequence([1, 2, 3], 4, constant(0.999))).toEqual([3, 2, 3, 2]);
  });

  it('survives a source that returns exactly 1', () => {
    expect(randomSequence([1, 2, 3], 3, constant(1))).toEqual([3, 2, 3]);
  });

  it('never repeats a note twice in a row', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const sequence = randomSequence(NOTE_READING_POOL, 200, seeded(seed));
      for (let i = 1; i < sequence.length; i++) {
        expect(sequence[i]).not.toBe(sequence[i - 1]);
      }
    }
  });

  it('only uses notes from the pool and reaches every one of them', () => {
    const sequence = randomSequence(NOTE_READING_POOL, 2000, seeded(7));
    expect(sequence.every((note) => NOTE_READING_POOL.includes(note))).toBe(true);
    expect(new Set(sequence)).toEqual(new Set(NOTE_READING_POOL));
  });

  it('gives different sequences for different sources', () => {
    const a = randomSequence(NOTE_READING_POOL, 20, seeded(1));
    const b = randomSequence(NOTE_READING_POOL, 20, seeded(2));
    expect(a).not.toEqual(b);
  });

  it('works with a pool of two notes (they alternate)', () => {
    expect(
      randomSequence([5, 9], 5, seeded(3)).every((n, i, all) => i === 0 || n !== all[i - 1]),
    ).toBe(true);
  });

  it('handles length 0 and 1, and refuses a pool that cannot avoid repeats', () => {
    expect(randomSequence(NOTE_READING_POOL, 0, seeded(1))).toEqual([]);
    expect(randomSequence([60], 1, seeded(1))).toEqual([60]);
    expect(() => randomSequence([60], 2, seeded(1))).toThrow(RangeError);
    expect(() => randomSequence([60, 60], 2, seeded(1))).toThrow(RangeError);
  });
});

describe('createNoteReadingLesson', () => {
  it('has 20 single-note steps from the pool, played in octave 4', () => {
    const lesson = createNoteReadingLesson(seeded(11));
    expect(lesson.id).toBe('note-reading');
    expect(lesson.baseOctave).toBe(4);
    expect(lesson.steps).toHaveLength(NOTE_READING_LENGTH);
    expect(NOTE_READING_LENGTH).toBe(20);
    for (const step of lesson.steps) {
      expect(step).toHaveLength(1);
      expect(NOTE_READING_POOL).toContain(step[0]);
    }
  });

  it('creates a new order each time it is called with a fresh source', () => {
    const random = seeded(5);
    const first = createNoteReadingLesson(random);
    const second = createNoteReadingLesson(random);
    expect(first.steps).not.toEqual(second.steps);
  });

  it('is reproducible with the same source', () => {
    expect(createNoteReadingLesson(seeded(9)).steps).toEqual(
      createNoteReadingLesson(seeded(9)).steps,
    );
  });
});

describe('lesson catalog', () => {
  it('has unique ids that match the lessons it creates', () => {
    const ids = LESSON_CATALOG.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const entry of LESSON_CATALOG) {
      const lesson = entry.create(seeded(1));
      expect(lesson.id).toBe(entry.id);
      expect(lesson.titleKey).toBe(entry.titleKey);
    }
  });
});

describe('evenPages', () => {
  it('splits into even pages of at most 8', () => {
    expect(evenPages(20)).toEqual([7, 7, 6]);
    expect(evenPages(12)).toEqual([6, 6]);
    expect(evenPages(8)).toEqual([8]);
    expect(evenPages(9)).toEqual([5, 4]);
    expect(evenPages(1)).toEqual([1]);
    expect(evenPages(0)).toEqual([]);
  });
});

describe('curriculum', () => {
  const lessons = LESSON_CATALOG.map((entry) => entry.create(seeded(3)));

  it('has the 13 lessons of the spec, in order, with note-reading kept', () => {
    expect(LESSON_CATALOG.map((entry) => entry.id)).toEqual([
      'treble-c-g',
      'note-reading',
      'treble-g-e',
      'bass-c-g',
      'bass-octave',
      'both-clefs',
      'melody-mary',
      'melody-ode',
      'melody-twinkle',
      'melody-ode-left',
      'intervals',
      'chords-major',
      'chords-all',
    ]);
    expect(LESSON_UNITS.map((unit) => unit.lessons.length)).toEqual([3, 2, 1, 4, 3]);
  });

  it('uses only white keys inside the keyboard window of its base octave', () => {
    for (const lesson of lessons) {
      expect(lesson.steps.length, lesson.id).toBeGreaterThan(0);
      const { low, high } = keyboardWindow(lesson.baseOctave);
      for (const note of lesson.steps.flat()) {
        expect(isBlackKey(note), `${lesson.id} ${note}`).toBe(false);
        expect(note, lesson.id).toBeGreaterThanOrEqual(low);
        expect(note, lesson.id).toBeLessThanOrEqual(high);
      }
    }
  });

  it('has pages that add up to the steps, at most 8 each', () => {
    for (const lesson of lessons) {
      expect(
        lesson.pages.reduce((sum, length) => sum + length, 0),
        lesson.id,
      ).toBe(lesson.steps.length);
      for (const length of lesson.pages) {
        expect(length, lesson.id).toBeGreaterThan(0);
        expect(length, lesson.id).toBeLessThanOrEqual(8);
      }
    }
  });

  it('never repeats a step twice in a row in random lessons', () => {
    for (let seed = 1; seed <= 50; seed++) {
      for (const entry of LESSON_CATALOG) {
        const steps = entry.create(seeded(seed)).steps;
        if (entry.id.startsWith('melody')) continue;
        for (let i = 1; i < steps.length; i++) {
          expect(steps[i].join(), entry.id).not.toBe(steps[i - 1].join());
        }
      }
    }
  });

  it('gives chord lessons at most three notes per step and 12 steps', () => {
    for (const id of ['intervals', 'chords-major', 'chords-all']) {
      const lesson = lessons.find((item) => item.id === id)!;
      expect(lesson.steps).toHaveLength(12);
      for (const step of lesson.steps) expect(step.length).toBeLessThanOrEqual(3);
    }
    expect(hasChords(lessons.find((item) => item.id === 'chords-all')!)).toBe(true);
    expect(hasChords(lessons.find((item) => item.id === 'note-reading')!)).toBe(false);
  });

  it('plays the written tunes', () => {
    const notesOf = (id: string) => lessons.find((item) => item.id === id)!.steps.flat();
    expect(notesOf('melody-mary').slice(0, 7)).toEqual([64, 62, 60, 62, 64, 64, 64]);
    expect(notesOf('melody-mary')).toHaveLength(26);
    expect(notesOf('melody-ode')).toHaveLength(30);
    expect(notesOf('melody-twinkle')).toHaveLength(42);
    expect(notesOf('melody-ode-left')).toEqual(notesOf('melody-ode').map((note) => note - 12));
    expect(lessons.find((item) => item.id === 'melody-ode')!.pages).toEqual([8, 7, 8, 7]);
  });

  it('builds intervals from a second to an octave', () => {
    expect(INTERVAL_POOL).toHaveLength(28);
    for (const [low, high] of INTERVAL_POOL) {
      expect(high).toBeGreaterThan(low);
      expect(high - low).toBeLessThanOrEqual(12);
    }
  });
});

describe('nextLessonId', () => {
  it('is the first lesson without a record', () => {
    expect(nextLessonId(LESSON_CATALOG, {})).toBe('treble-c-g');
    expect(nextLessonId(LESSON_CATALOG, { 'treble-c-g': {} })).toBe('note-reading');
    expect(nextLessonId(LESSON_CATALOG, { 'note-reading': {} })).toBe('treble-c-g');
  });

  it('is null when every lesson has a record', () => {
    const all = Object.fromEntries(LESSON_CATALOG.map((entry) => [entry.id, {}]));
    expect(nextLessonId(LESSON_CATALOG, all)).toBeNull();
  });
});
