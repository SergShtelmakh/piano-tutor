import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { HAND_KEYS } from '../core/course.ts';
import { accuracy, pageOf } from '../core/lesson.ts';
import { notesOutside } from '../core/keyboardRange.ts';
import { hasChords, type LessonEntry } from '../core/lessons.ts';
import { ROW_SCALES } from '../core/lessonLayout.ts';
import { beatSeconds, listenChunks, practiceHands, secondsPerUnit } from '../core/practice.ts';
import type { RunReward } from '../core/progress.ts';
import { useLocale, usePluralT, useT } from '../i18n/context.ts';
import { noteLabelFor } from '../i18n/noteNames.ts';
import type { MessageKey } from '../i18n/locales/en.ts';
import { useNoteBus } from '../input/context.ts';
import { useKeyboardRange } from '../keyboard/context.ts';
import { createSequencer } from '../lesson/sequencer.ts';
import { useLessonSettings } from '../lesson/settingsContext.ts';
import { useLesson } from '../lesson/useLesson.ts';
import { useMetronome } from '../lesson/useMetronome.ts';
import { useProgress } from '../progress/context.ts';

import LessonSummary from './LessonSummary.tsx';
import NotationView from './NotationView.tsx';
import { BackIcon, PauseIcon } from './icons.tsx';
import {
  HandSwitch,
  HintToggle,
  ListenButton,
  MetronomeToggle,
  TempoControl,
} from './LessonControls.tsx';
import MuteButton from './MuteButton.tsx';
import PauseOverlay from './PauseOverlay.tsx';
import { useOrientation } from './useWindowSize.ts';
import PianoKeyboard from './PianoKeyboard.tsx';
import { useSheetStyle } from '../display/useSheetStyle.ts';
import StaffView, { type StaffFlash } from './StaffView.tsx';
import { buttonIcon, buttonOutline, buttonSmall, card, notice } from './ui.ts';
import type { PracticeMode } from '../lesson/useLesson.ts';

/** The app's own notes sound for this share of a beat. */
const NOTE_HOLD = 0.8;

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
  const bus = useNoteBus();
  const { settings, setTempo, setMetronome, setHint } = useLessonSettings();
  // The layout of the screen's orientation; a rotation only redraws, the lesson goes on.
  const layout = settings.layouts[useOrientation()];
  const sheet = useSheetStyle();
  const [reward, setReward] = useState<RunReward | null>(null);
  // A run with one hand only is practice: it shows a summary but is not recorded.
  const [practiceRun, setPracticeRun] = useState(false);
  // Defined once per entry, so `restart` keeps its identity; each call builds a new random order.
  const createLesson = useCallback(() => entry.create(Math.random), [entry]);

  // Two players on the note bus: Listen, and the other hand's notes in a one-hand run.
  const listener = useMemo(() => createSequencer(bus), [bus]);
  const partner = useMemo(() => createSequencer(bus), [bus]);
  const listening = useSyncExternalStore(listener.subscribe, listener.busy);
  const tempoRef = useRef(settings.tempo);
  useEffect(() => {
    tempoRef.current = settings.tempo;
  });
  useEffect(
    () => () => {
      listener.stop();
      partner.stop();
    },
    [listener, partner],
  );
  const stopSounds = useCallback(() => {
    listener.stop();
    partner.stop();
  }, [listener, partner]);

  const {
    lesson,
    fullLesson,
    sourceIndex,
    hand,
    state,
    targets,
    feedback,
    paused,
    restart,
    pause,
    resume,
  } = useLesson(
    createLesson,
    (finished, end, practice) => {
      if (practice) {
        setPracticeRun(true);
        setReward(null);
      } else {
        setReward(recordRun(finished.id, accuracy(end)));
      }
    },
    (chunks) => {
      const tempo = tempoRef.current;
      partner.schedule(
        chunks.map((chunk) => ({
          notes: chunk.notes,
          at: chunk.offsetUnits * secondsPerUnit(tempo),
        })),
        beatSeconds(tempo) * NOTE_HOLD,
      );
    },
  );
  const startAgain = (nextHand?: PracticeMode) => {
    stopSounds();
    setReward(null);
    setPracticeRun(false);
    restart(nextHand);
  };
  const pauseLesson = () => {
    if (state.finished || paused) return;
    stopSounds();
    pause();
  };
  const togglePause = () => (paused ? resume() : pauseLesson());

  // The page hiding pauses the lesson; Space (when no control has focus) toggles the pause.
  const actions = useRef({ autoPause: pauseLesson, toggle: togglePause });
  useEffect(() => {
    actions.current = { autoPause: pauseLesson, toggle: togglePause };
  });
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) actions.current.autoPause();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat) return;
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      const control = (event.target as HTMLElement | null)?.closest<HTMLElement>(
        'button, a, input, select, textarea, [contenteditable="true"]',
      );
      // A control that Tab reaches handles Space itself; the piano keys (not in the tab order) don't.
      if (control && control.tabIndex >= 0) return;
      event.preventDefault();
      actions.current.toggle();
    };
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  useMetronome(settings.metronome && !paused && !state.finished, settings.tempo);

  // Listen plays the rest of the current page with both hands, from the step to play now.
  const toggleListen = () => {
    if (listening) {
      listener.stop();
      return;
    }
    const page = pageOf(lesson, state.stepIndex);
    const after = page.start + page.length;
    const from = sourceIndex ? sourceIndex[state.stepIndex] : state.stepIndex;
    const to = sourceIndex ? (sourceIndex[after] ?? fullLesson.steps.length) : after;
    listener.schedule(
      listenChunks(fullLesson, from, to, settings.tempo),
      beatSeconds(settings.tempo) * NOTE_HOLD,
    );
  };
  const hands = practiceHands(fullLesson);
  const canChooseHand = fullLesson.stepHands !== undefined;

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
  // In a one-hand run the other hand's notes are on screen too: they light up as the app plays them.
  const range = useMemo(() => {
    if (!fullLesson.notation) return undefined;
    const notes = fullLesson.steps.flat();
    return { low: Math.min(...notes), high: Math.max(...notes) };
  }, [fullLesson.notation, fullLesson.steps]);
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
    <div className="flex h-dvh flex-col bg-bg text-ink">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-3 py-3 short:flex-nowrap short:py-1.5 lg:flex-nowrap lg:px-5">
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
          className="mx-2 hidden h-1.5 min-w-20 max-w-64 flex-1 overflow-hidden rounded-full bg-line lg:block short:hidden"
        >
          <div
            className="h-full rounded-full bg-warm"
            style={{ width: `${(done / lesson.steps.length) * 100}%` }}
          />
        </div>
        <div className="flex-1" />
        {!state.finished && (
          <>
            <div
              role="group"
              aria-label={t('lessonControlsLabel')}
              className="order-last flex w-full flex-wrap items-center gap-2 short:order-none short:w-auto short:flex-nowrap lg:order-none lg:w-auto lg:flex-nowrap"
            >
              <ListenButton playing={listening} disabled={paused} onToggle={toggleListen} />
              <TempoControl bpm={settings.tempo} onChange={setTempo} />
              <MetronomeToggle
                on={settings.metronome}
                onToggle={() => setMetronome(!settings.metronome)}
              />
              <HintToggle on={settings.hint} onToggle={() => setHint(!settings.hint)} />
              {canChooseHand && (
                <HandSwitch hand={hand} available={hands} onChange={(next) => startAgain(next)} />
              )}
            </div>
            <button
              type="button"
              onClick={pauseLesson}
              aria-label={t('lessonPause')}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink hover:bg-accent-strong"
            >
              <PauseIcon size={24} />
            </button>
          </>
        )}
        <MuteButton />
      </header>
      <PauseOverlay
        open={paused}
        onResume={resume}
        onRestart={() => startAgain()}
        onExit={onExit}
        exitLabel={t(backKey)}
      />

      <main className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-3 py-4 short:py-2 wide:px-8">
        <div className="my-auto flex w-full flex-col items-center gap-4 short:gap-2">
          {state.finished ? (
            <LessonSummary
              state={state}
              reward={reward}
              onAgain={() => startAgain()}
              onExit={onExit}
              exitKey={backKey}
              practice={practiceRun}
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
                  rows={layout.rows}
                  scale={ROW_SCALES[layout.rowHeight]}
                />
              ) : (
                <div
                  className={`${card} flex w-full justify-center p-3 ${sheet === 'paper' ? 'sheet-paper' : ''}`}
                >
                  <StaffView
                    steps={pageSteps}
                    current={state.stepIndex - start}
                    playedNotes={state.playedInStep}
                    flash={flash}
                    labelNotes={targets}
                    scale={ROW_SCALES[layout.rowHeight]}
                  />
                </div>
              )}
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-ink-muted short:hidden">
                <span>{tp('correctCount', state.correct)}</span>
                <span>{tp('mistakesCount', state.mistakes)}</span>
                <button
                  type="button"
                  onClick={() => startAgain()}
                  className={`${buttonOutline} ${buttonSmall}`}
                >
                  {t('lessonRestart')}
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      <div className="px-2 pb-2">
        <PianoKeyboard
          feedback={feedback}
          focusNotes={targets}
          include={range}
          hints={settings.hint && !state.finished ? targets : undefined}
          height={layout.keyboardHeight}
          octaves={layout.octaves}
          allNames={layout.noteNames}
        />
      </div>
    </div>
  );
}
