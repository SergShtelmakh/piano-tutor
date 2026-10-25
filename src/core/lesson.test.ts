import { describe, expect, it } from 'vitest';
import {
  accuracy,
  currentTargets,
  judge,
  startLesson,
  type Lesson,
  type LessonState,
} from './lesson.ts';
import type { NoteEvent } from './types.ts';

const on = (note: number): NoteEvent => ({ type: 'noteon', note, velocity: 90, source: 'screen' });
const off = (note: number): NoteEvent => ({ type: 'noteoff', note, source: 'screen' });

const scale: Lesson = {
  id: 'test',
  titleKey: 'lessonNoteReadingTitle',
  baseOctave: 4,
  steps: [[60], [62], [64]],
};

const withChord: Lesson = { ...scale, steps: [[60, 64, 67], [62]] };

/** Feeds the notes one by one and returns the last state. */
function play(lesson: Lesson, notes: number[], from: LessonState = startLesson(lesson)) {
  let state = from;
  for (const note of notes) state = judge(lesson, state, on(note)).state;
  return state;
}

describe('startLesson', () => {
  it('starts at the first step with empty counters', () => {
    expect(startLesson(scale)).toEqual({
      stepIndex: 0,
      playedInStep: [],
      correct: 0,
      mistakes: 0,
      finished: false,
    });
    expect(currentTargets(scale, startLesson(scale))).toEqual([60]);
  });

  it('is finished at once when there are no steps', () => {
    expect(startLesson({ ...scale, steps: [] }).finished).toBe(true);
  });
});

describe('judge: single notes', () => {
  it('moves to the next step on the right note', () => {
    const result = judge(scale, startLesson(scale), on(60));
    expect(result.outcome).toBe('right');
    expect(result.note).toBe(60);
    expect(result.state.stepIndex).toBe(1);
    expect(result.state.correct).toBe(1);
    expect(currentTargets(scale, result.state)).toEqual([62]);
  });

  it('counts a mistake on a wrong note and keeps the target', () => {
    const result = judge(scale, startLesson(scale), on(61));
    expect(result.outcome).toBe('wrong');
    expect(result.note).toBe(61);
    expect(result.state.mistakes).toBe(1);
    expect(result.state.stepIndex).toBe(0);
    expect(currentTargets(scale, result.state)).toEqual([60]);
  });

  it('counts every wrong press, also the same key twice', () => {
    expect(play(scale, [61, 61, 61]).mistakes).toBe(3);
  });

  it('needs the exact pitch: the same pitch class in another octave is wrong', () => {
    for (const note of [48, 72, 59]) {
      expect(judge(scale, startLesson(scale), on(note)).outcome).toBe('wrong');
    }
  });

  it('ignores noteoff and sustain', () => {
    const state = startLesson(scale);
    expect(judge(scale, state, off(60))).toEqual({ state, outcome: 'ignored' });
    const pedal: NoteEvent = { type: 'sustain', on: true, source: 'midi' };
    expect(judge(scale, state, pedal)).toEqual({ state, outcome: 'ignored' });
  });

  it('does not change the state it is given', () => {
    const state = startLesson(scale);
    const copy = structuredClone(state);
    judge(scale, state, on(60));
    judge(scale, state, on(61));
    expect(state).toEqual(copy);
  });
});

describe('judge: finishing', () => {
  it('finishes after the last right note and keeps the counters', () => {
    const state = play(scale, [60, 61, 62, 64]);
    expect(state.finished).toBe(true);
    expect(state.correct).toBe(3);
    expect(state.mistakes).toBe(1);
    expect(currentTargets(scale, state)).toEqual([]);
  });

  it('ignores notes after the lesson is finished', () => {
    const done = play(scale, [60, 62, 64]);
    for (const note of [60, 61, 64]) {
      const result = judge(scale, done, on(note));
      expect(result.outcome).toBe('ignored');
      expect(result.state).toBe(done);
    }
  });
});

describe('judge: chords', () => {
  it('needs every note of the step, in any order', () => {
    const first = judge(withChord, startLesson(withChord), on(67));
    expect(first.outcome).toBe('right');
    expect(first.state.stepIndex).toBe(0);
    expect(first.state.playedInStep).toEqual([67]);

    const state = play(withChord, [60, 64], first.state);
    expect(state.stepIndex).toBe(1);
    expect(state.playedInStep).toEqual([]);
    expect(state.correct).toBe(3);
  });

  it('ignores a repeated chord note', () => {
    const first = judge(withChord, startLesson(withChord), on(60));
    const again = judge(withChord, first.state, on(60));
    expect(again.outcome).toBe('ignored');
    expect(again.state).toBe(first.state);
  });

  it('counts a wrong note inside a chord and keeps the played notes', () => {
    const state = play(withChord, [60, 61]);
    expect(state.mistakes).toBe(1);
    expect(state.playedInStep).toEqual([60]);
    expect(state.stepIndex).toBe(0);
  });
});

describe('accuracy', () => {
  it('is 1 when nothing was played or nothing went wrong', () => {
    expect(accuracy(startLesson(scale))).toBe(1);
    expect(accuracy(play(scale, [60, 62, 64]))).toBe(1);
  });

  it('is correct / (correct + mistakes)', () => {
    expect(accuracy({ ...startLesson(scale), correct: 12, mistakes: 3 })).toBeCloseTo(0.8);
    expect(accuracy({ ...startLesson(scale), correct: 0, mistakes: 4 })).toBe(0);
    expect(accuracy(play(scale, [61, 60, 61, 62, 64]))).toBeCloseTo(3 / 5);
  });
});
