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
  /** Notes of the current step that are held down right now (pressed during this step). */
  playedInStep: readonly number[];
  /** Right notes in finished steps. */
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
 * Judges one note event. A step is the set of notes to play; `playedInStep` holds the notes of the
 * current step that are pressed right now, so keys are never remembered after they are released:
 * a step with several notes is done only when all of them are held at once. A note outside the
 * step is a mistake and cancels the attempt (the learner presses the whole chord again). Notes that
 * were already down before the step began never count: only a `noteon` does. `correct` grows by the
 * size of the step when it is done. A step with one note is done by its `noteon`.
 */
export function judge(lesson: Lesson, state: LessonState, event: NoteEvent): JudgeResult {
  if (state.finished || event.type === 'sustain') return { state, outcome: 'ignored' };

  const note = event.note;

  if (event.type === 'noteoff') {
    if (!state.playedInStep.includes(note)) return { state, outcome: 'ignored' };
    const playedInStep = state.playedInStep.filter((held) => held !== note);
    return { state: { ...state, playedInStep }, outcome: 'ignored' };
  }

  const targets = currentTargets(lesson, state);

  if (!targets.includes(note)) {
    return {
      state: { ...state, playedInStep: [], mistakes: state.mistakes + 1 },
      outcome: 'wrong',
      note,
    };
  }
  if (state.playedInStep.includes(note)) return { state, outcome: 'ignored' };

  const played = [...state.playedInStep, note];
  if (played.length < targets.length) {
    return { state: { ...state, playedInStep: played }, outcome: 'right', note };
  }

  const stepIndex = state.stepIndex + 1;
  return {
    state: {
      ...state,
      stepIndex,
      playedInStep: [],
      correct: state.correct + targets.length,
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
