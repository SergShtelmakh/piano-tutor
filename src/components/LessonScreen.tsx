import { useCallback, useMemo, useState } from 'react';
import { HAND_KEYS } from '../core/course.ts';
import { accuracy, pageOf } from '../core/lesson.ts';
import { notesOutside } from '../core/keyboardRange.ts';
import { hasChords, type LessonEntry } from '../core/lessons.ts';
import type { RunReward } from '../core/progress.ts';
import { useLocale, usePluralT, useT } from '../i18n/context.ts';
import { noteLabelFor } from '../i18n/noteNames.ts';
import type { MessageKey } from '../i18n/locales/en.ts';
import { useKeyboardRange } from '../keyboard/context.ts';
import { useLesson } from '../lesson/useLesson.ts';
import { useProgress } from '../progress/context.ts';

import LessonSummary from './LessonSummary.tsx';
import NotationView from './NotationView.tsx';
import PianoKeyboard from './PianoKeyboard.tsx';
import StaffView, { type StaffFlash } from './StaffView.tsx';

const buttonClass =
  'rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100';

export default function LessonScreen({
  entry,
  onExit,
  backKey = 'lessonBack',
}: {
  entry: LessonEntry;
  onExit: () => void;
  /** The label of the back buttons: Home (default), or the course for a course lesson. */
  backKey?: MessageKey;
}) {
  const t = useT();
  const tp = usePluralT();
  const { locale } = useLocale();
  const { recordRun } = useProgress();
  const { range: keyboard } = useKeyboardRange();
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
  // Notes of this lesson that the learner's real keyboard doesn't have (the lesson stays playable).
  const outside = useMemo(() => notesOutside(lesson.steps, keyboard), [lesson.steps, keyboard]);
  const title = t(lesson.titleKey, lesson.titleParams);
  const heading = lesson.hand
    ? t('courseHeading', { hand: t(HAND_KEYS[lesson.hand]), title })
    : title;
  // A lesson of a piece shows its whole note range on the piano, so notes outside the computer keys
  // can be played on screen.
  const range = useMemo(() => {
    if (!lesson.notation) return undefined;
    const notes = lesson.steps.flat();
    return { low: Math.min(...notes), high: Math.max(...notes) };
  }, [lesson.notation, lesson.steps]);
  const flash: StaffFlash | null =
    completedStep !== null
      ? { step: completedStep - start, kind: 'right' }
      : feedback?.kind === 'wrong'
        ? { step: state.stepIndex - start, kind: 'wrong' }
        : null;

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {lesson.pieceTitle && <p className="text-sm text-slate-600">{lesson.pieceTitle}</p>}
      <h2 className="text-xl font-bold">{heading}</h2>

      {state.finished ? (
        <LessonSummary
          state={state}
          reward={reward}
          onAgain={startAgain}
          onExit={onExit}
          exitKey={backKey}
        />
      ) : (
        <>
          <p className="text-slate-700">
            {t(hasChords(lesson) ? 'lessonInstructionChords' : 'lessonInstructionNotes')}
          </p>
          {outside.count > 0 && (
            <p role="note" className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-900">
              {tp(
                outside.lowest !== undefined && outside.highest !== undefined
                  ? 'lessonOutsideBoth'
                  : outside.lowest !== undefined
                    ? 'lessonOutsideLow'
                    : 'lessonOutsideHigh',
                outside.count,
                {
                  lowest: outside.lowest === undefined ? '' : noteLabelFor(locale, outside.lowest),
                  highest:
                    outside.highest === undefined ? '' : noteLabelFor(locale, outside.highest),
                },
              )}
            </p>
          )}
          {lesson.notation ? (
            <NotationView
              notation={lesson.notation}
              stepIndex={state.stepIndex}
              targets={targets}
            />
          ) : (
            <div className="flex w-full justify-center rounded-lg bg-white p-3 shadow-sm">
              <StaffView
                steps={pageSteps}
                current={state.stepIndex - start}
                playedNotes={state.playedInStep}
                flash={flash}
                labelNotes={targets}
              />
            </div>
          )}
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
              {t(backKey)}
            </button>
          </div>
        </>
      )}

      <PianoKeyboard feedback={feedback} focusNotes={targets} include={range} />
    </div>
  );
}
