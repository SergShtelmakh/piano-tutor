import { createNoteReadingLesson } from '../core/lessons.ts';
import { usePluralT, useT } from '../i18n/context.ts';
import { useLesson } from '../lesson/useLesson.ts';
import LessonSummary from './LessonSummary.tsx';
import PianoKeyboard from './PianoKeyboard.tsx';
import StaffView from './StaffView.tsx';

// Defined once, so `restart` keeps its identity; each call builds a new random order.
const createLesson = () => createNoteReadingLesson(Math.random);

const buttonClass =
  'rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100';

export default function LessonScreen({ onExit }: { onExit: () => void }) {
  const t = useT();
  const tp = usePluralT();
  const { lesson, state, targets, feedback, restart } = useLesson(createLesson);

  const target = targets[0] ?? null;
  // After a right note the staff already moved on; show the played note for the flash instead.
  const drawn = feedback?.kind === 'right' ? feedback.note : target;

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <h2 className="text-xl font-bold">{t(lesson.titleKey)}</h2>

      {state.finished ? (
        <LessonSummary state={state} onAgain={restart} onExit={onExit} />
      ) : (
        <>
          <p className="text-slate-700">{t('lessonInstruction')}</p>
          <div className="flex w-full justify-center rounded-lg bg-white p-3 shadow-sm">
            <StaffView note={drawn} labelNote={target} feedback={feedback?.kind} />
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
            <button type="button" onClick={restart} className={buttonClass}>
              {t('lessonRestart')}
            </button>
            <button type="button" onClick={onExit} className={buttonClass}>
              {t('lessonBack')}
            </button>
          </div>
        </>
      )}

      <PianoKeyboard feedback={feedback} />
    </div>
  );
}
