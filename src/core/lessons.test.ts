import { describe, expect, it } from 'vitest';
import {
  LESSON_CATALOG,
  NOTE_READING_LENGTH,
  NOTE_READING_POOL,
  createNoteReadingLesson,
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
