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
import { BackIcon } from './icons.tsx';
import MuteButton from './MuteButton.tsx';
import PianoKeyboard from './PianoKeyboard.tsx';
import StaffView, { type StaffFlash } from './StaffView.tsx';
import { buttonIcon, buttonOutline, buttonSmall, card, notice } from './ui.ts';

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

  const subtitle = [
    lesson.pieceTitle,
    t('lessonProgress', {
      current: Math.min(state.stepIndex + 1, lesson.steps.length),
      total: lesson.steps.length,
    }),
  ]
    .filter(Boolean)
    .join(' · ');
  const done = state.finished ? lesson.steps.length : state.stepIndex;

  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <header className="flex items-center gap-3 border-b border-line px-3 py-3 short:py-1.5 wide:px-5">
        <button type="button" onClick={onExit} aria-label={t(backKey)} className={buttonIcon}>
          <BackIcon size={24} />
        </button>
        <div className="flex min-w-0 flex-col gap-0.5 text-left">
          <h1 className="truncate text-lg font-extrabold">{heading}</h1>
          <p className="truncate text-sm font-semibold text-ink-muted">{subtitle}</p>
        </div>
        <div
          role="progressbar"
          aria-label={t('lessonProgressLabel')}
          aria-valuemin={0}
          aria-valuemax={lesson.steps.length}
          aria-valuenow={done}
          className="mx-2 hidden h-1.5 min-w-20 max-w-64 flex-1 overflow-hidden rounded-full bg-line sm:block"
        >
          <div
            className="h-full rounded-full bg-warm"
            style={{ width: `${(done / lesson.steps.length) * 100}%` }}
          />
        </div>
        <div className="flex-1" />
        {!state.finished && (
          <button
            type="button"
            onClick={startAgain}
            className={`${buttonOutline} ${buttonSmall} hidden short:inline-flex`}
          >
            {t('lessonRestart')}
          </button>
        )}
        <MuteButton />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-3 py-4 short:gap-2 short:py-2 wide:px-8">
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
            <p className="text-center text-ink-muted short:hidden">
              {t(hasChords(lesson) ? 'lessonInstructionChords' : 'lessonInstructionNotes')}
            </p>
            {outside.count > 0 && (
              <p role="note" className={notice}>
                {tp(
                  outside.lowest !== undefined && outside.highest !== undefined
                    ? 'lessonOutsideBoth'
                    : outside.lowest !== undefined
                      ? 'lessonOutsideLow'
                      : 'lessonOutsideHigh',
                  outside.count,
                  {
                    lowest:
                      outside.lowest === undefined ? '' : noteLabelFor(locale, outside.lowest),
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
              <div className={`${card} flex w-full justify-center p-3`}>
                <StaffView
                  steps={pageSteps}
                  current={state.stepIndex - start}
                  playedNotes={state.playedInStep}
                  flash={flash}
                  labelNotes={targets}
                />
              </div>
            )}
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-ink-muted short:hidden">
              <span>{tp('correctCount', state.correct)}</span>
              <span>{tp('mistakesCount', state.mistakes)}</span>
              <button
                type="button"
                onClick={startAgain}
                className={`${buttonOutline} ${buttonSmall}`}
              >
                {t('lessonRestart')}
              </button>
            </div>
          </>
        )}
      </main>

      <div className="px-2 pb-2">
        <PianoKeyboard feedback={feedback} focusNotes={targets} include={range} />
      </div>
    </div>
  );
}
