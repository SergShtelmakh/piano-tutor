// Pure lesson model and judge: no React, DOM, or audio imports.
import type { MessageKey } from '../i18n/locales/en.ts';
import type { NoteEvent } from './types.ts';

/** A lesson is a list of steps; a step is the set of notes to play (one note, or a chord). */
export interface Lesson {
  id: string;
  titleKey: MessageKey;
  /** The octave of the C under the computer `A` key while this lesson is played. */
  baseOctave: number;
  steps: readonly (readonly number[])[];
  /** How many steps each page of the staff row holds, in order; the sum is `steps.length`. */
  pages: readonly number[];
}

export interface LessonState {
  stepIndex: number;
  /** Notes of the current step that were already played right. */
  playedInStep: readonly number[];
  /** Right notes so far. */
  correct: number;
  mistakes: number;
  finished: boolean;
}

export type Outcome = 'right' | 'wrong' | 'ignored';

export interface JudgeResult {
  state: LessonState;
  outcome: Outcome;
  /** The judged note, for `right` and `wrong`. */
  note?: number;
}

/** The page that holds `stepIndex`: the index of its first step and its length. */
export function pageOf(lesson: Lesson, stepIndex: number): { start: number; length: number } {
  let start = 0;
  for (const length of lesson.pages) {
    if (stepIndex < start + length) return { start, length };
    start += length;
  }
  return { start, length: 0 };
}

export function startLesson(lesson: Lesson): LessonState {
  return {
    stepIndex: 0,
    playedInStep: [],
    correct: 0,
    mistakes: 0,
    finished: lesson.steps.length === 0,
  };
}

/** The notes the learner has to play now; empty when the lesson is finished. */
export function currentTargets(lesson: Lesson, state: LessonState): readonly number[] {
  return state.finished ? [] : (lesson.steps[state.stepIndex] ?? []);
}

/**
 * Judges one note event. Only `noteon` counts. A note that belongs to the current step and was
 * not played yet is right; any other note is a mistake, and the target stays the same.
 */
export function judge(lesson: Lesson, state: LessonState, event: NoteEvent): JudgeResult {
  if (event.type !== 'noteon' || state.finished) return { state, outcome: 'ignored' };

  const note = event.note;
  const targets = currentTargets(lesson, state);

  if (!targets.includes(note)) {
    return { state: { ...state, mistakes: state.mistakes + 1 }, outcome: 'wrong', note };
  }
  if (state.playedInStep.includes(note)) return { state, outcome: 'ignored' };

  const played = [...state.playedInStep, note];
  const correct = state.correct + 1;
  if (played.length < targets.length) {
    return { state: { ...state, playedInStep: played, correct }, outcome: 'right', note };
  }

  const stepIndex = state.stepIndex + 1;
  return {
    state: {
      ...state,
      stepIndex,
      playedInStep: [],
      correct,
      finished: stepIndex >= lesson.steps.length,
    },
    outcome: 'right',
    note,
  };
}

/** Right notes divided by all judged notes, 0 to 1. Nothing played counts as 1. */
export function accuracy(state: LessonState): number {
  const total = state.correct + state.mistakes;
  return total === 0 ? 1 : state.correct / total;
}
