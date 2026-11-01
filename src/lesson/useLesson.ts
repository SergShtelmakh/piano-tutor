import { useCallback, useEffect, useRef, useState } from 'react';
import {
  currentTargets,
  judge,
  startLesson,
  type Lesson,
  type LessonState,
} from '../core/lesson.ts';
import {
  oneHandLesson,
  type AccompanimentChunk,
  type OneHandLesson,
  type PracticeHand,
} from '../core/practice.ts';
import { useBaseOctave, useNoteBus } from '../input/context.ts';

/** How long a key and the note flash green or red after a judgement. */
export const FEEDBACK_MS = 300;

/** Which hand the learner plays: both (the lesson as made) or one, the app playing the other. */
export type PracticeMode = 'both' | PracticeHand;

export interface LessonFeedback {
  note: number;
  kind: 'right' | 'wrong';
  /** Changes on every judgement, so the same key can flash twice in a row. */
  id: number;
  /** For a `right` note that finished its step: the index of that step; otherwise null. */
  completedStep: number | null;
}

interface Source {
  /** The lesson as made, with both hands. */
  full: Lesson;
  /** The lesson as one hand plays it, or null when both hands play. */
  one: OneHandLesson | null;
  hand: PracticeMode;
}

function build(createLesson: () => Lesson, hand: PracticeMode): Source {
  const full = createLesson();
  const one = hand === 'both' ? null : oneHandLesson(full, hand);
  return { full, one, hand: one ? hand : 'both' };
}

/**
 * Runs a lesson on the note bus: every `noteon`, from any source, is judged at once.
 * `createLesson` is called for the first lesson and again on every restart (a new random order).
 * `onFinish` is called once, when the last step is judged right; `practice` is true when only one
 * hand was played. `onStepDone` is called when a step is done in a one-hand lesson, with what the
 * app plays for the other hand.
 * While the hook is mounted the base octave is the lesson's; it is restored when it unmounts.
 * While paused, nothing is judged.
 */
export function useLesson(
  createLesson: () => Lesson,
  onFinish?: (lesson: Lesson, state: LessonState, practice: boolean) => void,
  onStepDone?: (accompaniment: readonly AccompanimentChunk[]) => void,
) {
  const bus = useNoteBus();
  const { baseOctave, setBaseOctave } = useBaseOctave();
  const [source, setSource] = useState(() => build(createLesson, 'both'));
  const lesson = source.one?.lesson ?? source.full;
  const [state, setState] = useState<LessonState>(() => startLesson(lesson));
  const [feedback, setFeedback] = useState<LessonFeedback | null>(null);
  const [paused, setPaused] = useState(false);

  // Read by the bus listener, so judging does not wait for a re-render.
  const sourceRef = useRef(source);
  const stateRef = useRef(state);
  const pausedRef = useRef(false);
  const feedbackId = useRef(0);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const octaveBeforeLesson = useRef(baseOctave);
  const onFinishRef = useRef(onFinish);
  const onStepDoneRef = useRef(onStepDone);

  useEffect(() => {
    onFinishRef.current = onFinish;
    onStepDoneRef.current = onStepDone;
  });

  useEffect(() => {
    return bus.subscribe((event) => {
      if (pausedRef.current) return;
      const current = sourceRef.current;
      const judged = current.one?.lesson ?? current.full;
      const result = judge(judged, stateRef.current, event);
      if (result.outcome === 'ignored' || result.note === undefined) {
        // A released chord key changes the state without a judgement.
        if (result.state !== stateRef.current) {
          stateRef.current = result.state;
          setState(result.state);
        }
        return;
      }

      const previous = stateRef.current;
      stateRef.current = result.state;
      const stepDone = result.outcome === 'right' && result.state.stepIndex > previous.stepIndex;
      // Called from the listener, not an effect, so Strict Mode cannot report a finish twice.
      if (stepDone && current.one) {
        onStepDoneRef.current?.(current.one.accompaniment[previous.stepIndex] ?? []);
      }
      if (result.state.finished) onFinishRef.current?.(judged, result.state, current.one !== null);
      setState(result.state);
      setFeedback({
        note: result.note,
        kind: result.outcome,
        id: ++feedbackId.current,
        completedStep: stepDone ? previous.stepIndex : null,
      });
      clearTimeout(feedbackTimer.current);
      feedbackTimer.current = setTimeout(() => setFeedback(null), FEEDBACK_MS);
    });
  }, [bus]);

  useEffect(() => {
    setBaseOctave(lesson.baseOctave);
  }, [lesson.baseOctave, setBaseOctave]);

  useEffect(() => {
    const before = octaveBeforeLesson.current;
    return () => {
      clearTimeout(feedbackTimer.current);
      setBaseOctave(before);
    };
  }, [setBaseOctave]);

  /** Starts over, with the same hand unless another is given. Also ends a pause. */
  const restart = useCallback(
    (hand?: PracticeMode) => {
      const next = build(createLesson, hand ?? sourceRef.current.hand);
      const fresh = startLesson(next.one?.lesson ?? next.full);
      sourceRef.current = next;
      stateRef.current = fresh;
      pausedRef.current = false;
      clearTimeout(feedbackTimer.current);
      setSource(next);
      setState(fresh);
      setFeedback(null);
      setPaused(false);
    },
    [createLesson],
  );

  const pause = useCallback(() => {
    pausedRef.current = true;
    setPaused(true);
    // Keys held now are not remembered: after Resume the step is played afresh.
    if (stateRef.current.playedInStep.length > 0) {
      const cleared = { ...stateRef.current, playedInStep: [] };
      stateRef.current = cleared;
      setState(cleared);
    }
    clearTimeout(feedbackTimer.current);
    setFeedback(null);
  }, []);

  const resume = useCallback(() => {
    pausedRef.current = false;
    setPaused(false);
  }, []);

  return {
    lesson,
    /** The lesson with both hands, whatever hand is practised. */
    fullLesson: source.full,
    /** For each step of `lesson`, its index in `fullLesson`; null when both hands play. */
    sourceIndex: source.one?.sourceIndex ?? null,
    hand: source.hand,
    state,
    targets: currentTargets(lesson, state),
    feedback,
    paused,
    restart,
    pause,
    resume,
  };
}
