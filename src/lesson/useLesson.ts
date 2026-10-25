import { useCallback, useEffect, useRef, useState } from 'react';
import {
  currentTargets,
  judge,
  startLesson,
  type Lesson,
  type LessonState,
} from '../core/lesson.ts';
import { useBaseOctave, useNoteBus } from '../input/context.ts';

/** How long a key and the note flash green or red after a judgement. */
export const FEEDBACK_MS = 300;

export interface LessonFeedback {
  note: number;
  kind: 'right' | 'wrong';
  /** Changes on every judgement, so the same key can flash twice in a row. */
  id: number;
}

/**
 * Runs a lesson on the note bus: every `noteon`, from any source, is judged at once.
 * `createLesson` is called for the first lesson and again on every restart (a new random order).
 * While the hook is mounted the base octave is the lesson's; it is restored when it unmounts.
 */
export function useLesson(createLesson: () => Lesson) {
  const bus = useNoteBus();
  const { baseOctave, setBaseOctave } = useBaseOctave();
  const [lesson, setLesson] = useState(createLesson);
  const [state, setState] = useState<LessonState>(() => startLesson(lesson));
  const [feedback, setFeedback] = useState<LessonFeedback | null>(null);

  // Read by the bus listener, so judging does not wait for a re-render.
  const lessonRef = useRef(lesson);
  const stateRef = useRef(state);
  const feedbackId = useRef(0);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const octaveBeforeLesson = useRef(baseOctave);

  useEffect(() => {
    return bus.subscribe((event) => {
      const result = judge(lessonRef.current, stateRef.current, event);
      if (result.outcome === 'ignored' || result.note === undefined) return;

      stateRef.current = result.state;
      setState(result.state);
      setFeedback({ note: result.note, kind: result.outcome, id: ++feedbackId.current });
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

  const restart = useCallback(() => {
    const next = createLesson();
    const fresh = startLesson(next);
    lessonRef.current = next;
    stateRef.current = fresh;
    clearTimeout(feedbackTimer.current);
    setLesson(next);
    setState(fresh);
    setFeedback(null);
  }, [createLesson]);

  return { lesson, state, targets: currentTargets(lesson, state), feedback, restart };
}
