import { courseLessons, finishedLessons, HAND_KEYS } from '../core/course.ts';
import { nextLessonId } from '../core/lessons.ts';
import { LIBRARY_COMPOSERS } from '../core/libraryCatalog.ts';
import { useCourse } from '../course/context.ts';
import { usePluralT, useT } from '../i18n/context.ts';
import { usePlayerValue } from '../playback/context.ts';
import { PLAYER_ERROR_KEYS } from '../playback/errorKeys.ts';
import { useProgress } from '../progress/context.ts';
import DifficultyDots from './DifficultyDots.tsx';
import { BackIcon } from './icons.tsx';
import LessonCard from './LessonCard.tsx';
import { buttonIcon, buttonOutline, buttonSmall, card, sectionLabel } from './ui.ts';

const buttonClass = `${buttonOutline} ${buttonSmall}`;

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
  const { source, status, course, error, closeCourse, retry } = useCourse();
  const { openLibraryPiece } = usePlayerValue();
  const { progress } = useProgress();
  if (!source) return null;

  // A file from the learner's disk has no composer, portrait, or difficulty.
  const piece = source.kind === 'library' ? source.piece : null;
  const title = source.kind === 'library' ? source.piece.title : source.title;
  const composer = piece && LIBRARY_COMPOSERS.find((item) => item.id === piece.composer);
  const lessons = course ? courseLessons(course) : [];
  const nextId = nextLessonId(lessons, progress.lessons);
  const finished = course ? finishedLessons(course, progress.lessons) : 0;

  const openInPlayer = () => {
    // A file is still open in the Player; only a library piece has to be opened again.
    if (piece) void openLibraryPiece(piece);
    onOpenInPlayer();
  };

  return (
    <div className="flex w-full max-w-3xl flex-col gap-4 text-left">
      <div className="flex flex-wrap items-center gap-3 py-4 wide:pt-8">
        <button
          type="button"
          className={buttonIcon}
          onClick={closeCourse}
          aria-label={t('courseBack')}
        >
          <BackIcon size={24} />
        </button>
        <button type="button" className={buttonClass} onClick={openInPlayer}>
          {t('courseOpenInPlayer')}
        </button>
      </div>

      <section className={`${card} flex w-full flex-col gap-1 p-5`}>
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink">
          {composer && <span>{t(composer.nameKey)}</span>}
          {piece && <DifficultyDots level={piece.difficulty} />}
        </p>
        {status === 'ready' && course && (
          <>
            <p className="text-sm text-ink-muted">
              {course.truncated && course.covered
                ? t('courseCoversPart', {
                    from: course.covered.from,
                    to: course.covered.to,
                    total: course.totalBars,
                  })
                : t('courseCoversAll', { total: course.totalBars })}
            </p>
            <p className="text-sm font-bold text-ink">
              {tp('courseFinished', lessons.length, { done: finished })}
            </p>
          </>
        )}
      </section>

      {status === 'loading' && (
        <p role="status" className="text-ink-muted">
          {t('courseLoading')}
        </p>
      )}

      {status === 'error' && error && (
        <div role="alert" className="flex flex-col items-start gap-2">
          <p className="rounded-xl bg-wrong-soft px-4 py-3 text-sm text-wrong">
            {t(PLAYER_ERROR_KEYS[error])}
          </p>
          <button type="button" className={buttonClass} onClick={retry}>
            {t('courseRetry')}
          </button>
        </div>
      )}

      {status === 'ready' &&
        course?.stages.map((stage) => (
          <section key={stage.hand} className="flex w-full flex-col gap-3">
            <h2 className={sectionLabel}>{t(HAND_KEYS[stage.hand])}</h2>
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
