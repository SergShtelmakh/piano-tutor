import { courseLessons, finishedLessons, HAND_KEYS } from '../core/course.ts';
import { nextLessonId } from '../core/lessons.ts';
import { LIBRARY_COMPOSERS } from '../core/libraryCatalog.ts';
import { useCourse } from '../course/context.ts';
import { usePluralT, useT } from '../i18n/context.ts';
import { usePlayerValue } from '../playback/context.ts';
import { PLAYER_ERROR_KEYS } from '../playback/errorKeys.ts';
import { useProgress } from '../progress/context.ts';
import DifficultyDots from './DifficultyDots.tsx';
import LessonCard from './LessonCard.tsx';

const buttonClass =
  'rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-100';

/** The lessons of the open piece's course, grouped by hand, from the simplest to the hardest. */
export default function CourseScreen({
  onStart,
  onOpenInPlayer,
}: {
  onStart: (lessonId: string) => void;
  /** Called after the piece is sent to the Player, so the app can switch to it. */
  onOpenInPlayer: () => void;
}) {
  const t = useT();
  const tp = usePluralT();
  const { piece, status, course, error, closeCourse, retry } = useCourse();
  const { openLibraryPiece } = usePlayerValue();
  const { progress } = useProgress();
  if (!piece) return null;

  const composer = LIBRARY_COMPOSERS.find((item) => item.id === piece.composer);
  const lessons = course ? courseLessons(course) : [];
  const nextId = nextLessonId(lessons, progress.lessons);
  const finished = course ? finishedLessons(course, progress.lessons) : 0;

  const openInPlayer = () => {
    void openLibraryPiece(piece);
    onOpenInPlayer();
  };

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button type="button" className={buttonClass} onClick={closeCourse}>
          {t('courseBack')}
        </button>
        <button type="button" className={buttonClass} onClick={openInPlayer}>
          {t('courseOpenInPlayer')}
        </button>
      </div>

      <section className="flex w-full flex-col items-center gap-1 rounded-lg bg-white px-4 py-3 shadow-sm">
        <h2 className="text-xl font-bold">{piece.title}</h2>
        <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-slate-700">
          {composer && <span>{t(composer.nameKey)}</span>}
          <DifficultyDots level={piece.difficulty} />
        </p>
        {status === 'ready' && course && (
          <>
            <p className="text-sm text-slate-600">
              {course.truncated && course.covered
                ? t('courseCoversPart', {
                    from: course.covered.from,
                    to: course.covered.to,
                    total: course.totalBars,
                  })
                : t('courseCoversAll', { total: course.totalBars })}
            </p>
            <p className="text-sm font-semibold text-slate-800">
              {tp('courseFinished', lessons.length, { done: finished })}
            </p>
          </>
        )}
      </section>

      {status === 'loading' && (
        <p role="status" className="text-slate-600">
          {t('courseLoading')}
        </p>
      )}

      {status === 'error' && error && (
        <div role="alert" className="flex flex-col items-center gap-2">
          <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-800">
            {t(PLAYER_ERROR_KEYS[error])}
          </p>
          <button type="button" className={buttonClass} onClick={retry}>
            {t('courseRetry')}
          </button>
        </div>
      )}

      {status === 'ready' &&
        course?.stages.map((stage) => (
          <section key={stage.hand} className="flex w-full flex-col items-center gap-3">
            <h3 className="w-full text-left text-lg font-semibold text-slate-800">
              {t(HAND_KEYS[stage.hand])}
            </h3>
            {stage.lessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                id={lesson.id}
                title={t(lesson.titleKey, lesson.titleParams)}
                detail={tp('courseSteps', lesson.stepCount)}
                isNext={lesson.id === nextId}
                onStart={() => onStart(lesson.id)}
              />
            ))}
          </section>
        ))}
    </div>
  );
}
