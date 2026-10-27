import { useCallback, useMemo, useState } from 'react';
import { accuracy, pageOf } from '../core/lesson.ts';
import { hasChords, type LessonEntry } from '../core/lessons.ts';
import type { RunReward } from '../core/progress.ts';
import { usePluralT, useT } from '../i18n/context.ts';
import { useLesson } from '../lesson/useLesson.ts';
import { useProgress } from '../progress/context.ts';

import LessonSummary from './LessonSummary.tsx';
import PianoKeyboard from './PianoKeyboard.tsx';
import StaffView, { type StaffFlash } from './StaffView.tsx';

const buttonClass =
  'rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100';

export default function LessonScreen({
  entry,
  onExit,
}: {
  entry: LessonEntry;
  onExit: () => void;
}) {
  const t = useT();
  const tp = usePluralT();
  const { recordRun } = useProgress();
  const [reward, setReward] = useState<RunReward | null>(null);
  // Defined once per entry, so `restart` keeps its identity; each call builds a new random order.
  const createLesson = useCallback(() => entry.create(Math.random), [entry]);
  const { lesson, state, targets, feedback, restart } = useLesson(createLesson, (finished, end) =>
    setReward(recordRun(finished.id, accuracy(end))),
  );
  const startAgain = () => {
    setReward(null);
    restart();
  };

  // After a right note finished a step the staff already moved on; keep the page of that step on
  // screen for the flash, so the last step of a page is not swallowed by the next page.
  const completedStep = feedback?.kind === 'right' ? feedback.completedStep : null;
  const { start, length } = pageOf(lesson, completedStep ?? state.stepIndex);
  const pageSteps = useMemo(
    () => lesson.steps.slice(start, start + length),
    [lesson.steps, start, length],
  );
  const flash: StaffFlash | null =
    completedStep !== null
      ? { step: completedStep - start, kind: 'right' }
      : feedback?.kind === 'wrong'
        ? { step: state.stepIndex - start, kind: 'wrong' }
        : null;

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <h2 className="text-xl font-bold">{t(lesson.titleKey)}</h2>

      {state.finished ? (
        <LessonSummary state={state} reward={reward} onAgain={startAgain} onExit={onExit} />
      ) : (
        <>
          <p className="text-slate-700">
            {t(hasChords(lesson) ? 'lessonInstructionChords' : 'lessonInstructionNotes')}
          </p>
          <div className="flex w-full justify-center rounded-lg bg-white p-3 shadow-sm">
            <StaffView
              steps={pageSteps}
              current={state.stepIndex - start}
              playedNotes={state.playedInStep}
              flash={flash}
              labelNotes={targets}
            />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-slate-700">
            <span>
              {t('lessonProgress', {
                current: state.stepIndex + 1,
                total: lesson.steps.length,
              })}
            </span>
            <span>{tp('correctCount', state.correct)}</span>
            <span>{tp('mistakesCount', state.mistakes)}</span>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={startAgain} className={buttonClass}>
              {t('lessonRestart')}
            </button>
            <button type="button" onClick={onExit} className={buttonClass}>
              {t('lessonBack')}
            </button>
          </div>
        </>
      )}

      <PianoKeyboard feedback={feedback} focusNotes={targets} />
    </div>
  );
}
