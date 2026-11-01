import { describe, expect, it } from 'vitest';
import type { Lesson } from './lesson.ts';
import {
  beatSeconds,
  clampTempo,
  DEFAULT_LESSON_SETTINGS,
  listenChunks,
  oneHandLesson,
  parseLessonSettings,
  practiceHands,
  secondsPerUnit,
  serialiseLessonSettings,
  stepTempo,
  TEMPO,
} from './practice.ts';

// Both hands over four steps: right 60 | 62 | - | 64, left 48 | - | 50 | 52, a quarter apart.
const both: Lesson = {
  id: 'melody:test:both:part-1',
  titleKey: 'courseLessonPart',
  baseOctave: 4,
  hand: 'both',
  steps: [[48, 60], [62], [50], [52, 64]],
  pages: [4],
  stepUnits: [0, 4, 8, 12],
  stepHands: { right: [[60], [62], [], [64]], left: [[48], [], [50], [52]] },
  notation: {
    score: { bars: [] } as never,
    stepTimes: [0, 0.5, 1, 1.5],
  },
};

describe('tempo', () => {
  it('moves by 5 and stays between 40 and 200', () => {
    expect(stepTempo(80, 1)).toBe(85);
    expect(stepTempo(80, -1)).toBe(75);
    expect(stepTempo(TEMPO.max, 1)).toBe(TEMPO.max);
    expect(stepTempo(TEMPO.min, -1)).toBe(TEMPO.min);
  });

  it('snaps and clamps any value, and falls back to the default for junk', () => {
    expect(clampTempo(83)).toBe(85);
    expect(clampTempo(1)).toBe(40);
    expect(clampTempo(999)).toBe(200);
    expect(clampTempo(Number.NaN)).toBe(TEMPO.default);
  });

  it('turns bpm into seconds per beat and per sixteenth', () => {
    expect(beatSeconds(120)).toBe(0.5);
    expect(beatSeconds(60)).toBe(1);
    expect(secondsPerUnit(120)).toBe(0.125);
  });
});

describe('listenChunks', () => {
  it('plays one step per beat for a lesson without a rhythm', () => {
    const plain: Lesson = { ...both, stepUnits: undefined };
    const chunks = listenChunks(plain, 0, 4, 120);
    expect(chunks.map((chunk) => chunk.at)).toEqual([0, 0.5, 1, 1.5]);
    expect(chunks.map((chunk) => chunk.notes)).toEqual(plain.steps);
  });

  it('follows the rhythm of the piece', () => {
    const rhythm: Lesson = { ...both, stepUnits: [0, 2, 8, 9] };
    expect(listenChunks(rhythm, 0, 4, 120).map((chunk) => chunk.at)).toEqual([0, 0.25, 1, 1.125]);
  });

  it('starts at the current step and ends before `to`', () => {
    const chunks = listenChunks(both, 1, 3, 120);
    expect(chunks.map((chunk) => chunk.notes)).toEqual([[62], [50]]);
    expect(chunks[0].at).toBe(0);
    expect(chunks[1].at).toBe(0.5);
  });

  it('is faster at a higher tempo', () => {
    const slow = listenChunks(both, 0, 2, 60)[1].at;
    const fast = listenChunks(both, 0, 2, 120)[1].at;
    expect(fast).toBe(slow / 2);
  });

  it('is empty for an empty or reversed range', () => {
    expect(listenChunks(both, 2, 2, 80)).toEqual([]);
    expect(listenChunks(both, 3, 1, 80)).toEqual([]);
    expect(listenChunks(both, 10, 20, 80)).toEqual([]);
  });
});

describe('practiceHands', () => {
  it('offers the hands that have notes in a both-hands lesson', () => {
    expect(practiceHands(both)).toEqual({ right: true, left: true });
    const rightOnly: Lesson = {
      ...both,
      stepHands: { right: [[60]], left: [[]] },
    };
    expect(practiceHands(rightOnly)).toEqual({ right: true, left: false });
  });

  it('offers nothing for a lesson without hands', () => {
    expect(practiceHands({ ...both, stepHands: undefined })).toEqual({
      right: false,
      left: false,
    });
  });
});

describe('oneHandLesson', () => {
  it('is null for a lesson that has no hands to split', () => {
    expect(oneHandLesson({ ...both, stepHands: undefined }, 'right')).toBeNull();
  });

  it('keeps the steps where the hand has notes, with only its notes', () => {
    const result = oneHandLesson(both, 'right')!;
    expect(result.lesson.steps).toEqual([[60], [62], [64]]);
    expect(result.sourceIndex).toEqual([0, 1, 3]);
    expect(result.lesson.pages).toEqual([3]);
    expect(result.lesson.stepUnits).toEqual([0, 4, 12]);
    expect(result.lesson.notation?.stepTimes).toEqual([0, 0.5, 1.5]);
    expect(result.lesson.stepHands).toBeUndefined();
    expect(result.lesson.id).toBe(both.id);
  });

  it('plays the other hand after each step, then its skipped steps in rhythm', () => {
    const { accompaniment } = oneHandLesson(both, 'right')!;
    expect(accompaniment[0]).toEqual([{ notes: [48], offsetUnits: 0 }]);
    // Nothing of the left hand at step 1; its step 2 (a quarter later) is played with it.
    expect(accompaniment[1]).toEqual([{ notes: [50], offsetUnits: 4 }]);
    expect(accompaniment[2]).toEqual([{ notes: [52], offsetUnits: 0 }]);
  });

  it('does the same for the left hand', () => {
    const result = oneHandLesson(both, 'left')!;
    expect(result.lesson.steps).toEqual([[48], [50], [52]]);
    expect(result.sourceIndex).toEqual([0, 2, 3]);
    expect(result.accompaniment[0]).toEqual([
      { notes: [60], offsetUnits: 0 },
      { notes: [62], offsetUnits: 4 },
    ]);
    expect(result.accompaniment[1]).toEqual([]);
    expect(result.accompaniment[2]).toEqual([{ notes: [64], offsetUnits: 0 }]);
  });

  it('does not play the other hand before the first step of the learner', () => {
    const lateRight: Lesson = {
      ...both,
      steps: [[48], [50, 60]],
      stepUnits: [0, 4],
      stepHands: { right: [[], [60]], left: [[48], [50]] },
    };
    const { accompaniment, sourceIndex } = oneHandLesson(lateRight, 'right')!;
    expect(sourceIndex).toEqual([1]);
    expect(accompaniment).toEqual([[{ notes: [50], offsetUnits: 0 }]]);
  });

  it('does not play a pitch the learner already played (a unison)', () => {
    const unison: Lesson = {
      ...both,
      steps: [[48, 60]],
      stepUnits: [0],
      stepHands: { right: [[60]], left: [[60, 48]] },
    };
    expect(oneHandLesson(unison, 'right')!.accompaniment[0]).toEqual([
      { notes: [48], offsetUnits: 0 },
    ]);
    expect(oneHandLesson(unison, 'left')!.accompaniment[0]).toEqual([]);
  });

  it('gives an empty lesson for a hand that never plays', () => {
    const rightOnly: Lesson = { ...both, stepHands: { right: [[60]], left: [[]] }, steps: [[60]] };
    const result = oneHandLesson(rightOnly, 'left')!;
    expect(result.lesson.steps).toEqual([]);
    expect(result.lesson.pages).toEqual([]);
  });

  it('does not change the full lesson', () => {
    const before = JSON.stringify(both);
    oneHandLesson(both, 'right');
    expect(JSON.stringify(both)).toBe(before);
  });
});

describe('lesson settings', () => {
  it('round-trips', () => {
    const settings = { tempo: 120, metronome: true, hint: true };
    expect(parseLessonSettings(serialiseLessonSettings(settings))).toEqual(settings);
  });

  it('falls back to the defaults for nothing, junk, or another version', () => {
    for (const text of [null, '', 'nope', 'null', '[]', '{"version":2,"tempo":100}']) {
      expect(parseLessonSettings(text), String(text)).toEqual(DEFAULT_LESSON_SETTINGS);
    }
  });

  it('repairs one bad field and keeps the others', () => {
    const text = JSON.stringify({ version: 1, tempo: 'fast', metronome: true, hint: 'yes' });
    expect(parseLessonSettings(text)).toEqual({ tempo: 80, metronome: true, hint: false });
    expect(parseLessonSettings('{"version":1,"tempo":1000}').tempo).toBe(200);
  });
});
