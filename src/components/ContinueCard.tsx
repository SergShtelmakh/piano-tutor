import { LESSON_CATALOG } from '../core/lessons.ts';
import { LIBRARY_PIECES } from '../core/libraryCatalog.ts';
import { continueTarget, entryProgress, type MyLessonEntry } from '../core/myLessons.ts';
import { usePluralT, useT } from '../i18n/context.ts';
import { useMyLessons } from '../myLessons/context.ts';
import { useProgress } from '../progress/context.ts';
import { PlayIcon } from './icons.tsx';
import { card } from './ui.ts';

/**
 * Opens what the learner played last: the next built-in lesson, or the next lesson of the piece
 * they were learning. Hidden when there is nothing left to continue.
 */
export default function ContinueCard({
  onStart,
  onContinuePiece,
}: {
  onStart: (lessonId: string) => void;
  /** Opens the course of a piece and then its next lesson. */
  onContinuePiece: (entry: MyLessonEntry, lastLessonId: string) => void;
}) {
  const t = useT();
  const tp = usePluralT();
  const { progress } = useProgress();
  const { entries } = useMyLessons();
  const target = continueTarget(
    progress.lastLessonId,
    entries,
    LESSON_CATALOG,
    progress.lessons,
    LIBRARY_PIECES,
  );
  if (!target) return null;

  let title: string;
  let done: number;
  let total: number | null;
  let countLabel: string | null = null;
  let open: () => void;
  if (target.kind === 'builtin') {
    const entry = LESSON_CATALOG.find((item) => item.id === target.lessonId);
    if (!entry) return null;
    title = t(entry.titleKey);
    done = LESSON_CATALOG.filter((item) => progress.lessons[item.id] !== undefined).length;
    total = LESSON_CATALOG.length;
    open = () => onStart(entry.id);
  } else {
    const { entry } = target;
    title = LIBRARY_PIECES.find((piece) => piece.id === entry.id)?.title ?? entry.title;
    done = entryProgress(entry, progress.lessons).finished;
    total = entry.lessonCount ?? null;
    if (total === null) countLabel = tp('homePieceFinished', done);
    open = () => onContinuePiece(entry, target.lastLessonId);
  }

  return (
    <button
      type="button"
      onClick={open}
      className={`${card} flex w-full items-center gap-4 p-4 text-left hover:bg-surface-raised`}
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink">
        <PlayIcon size={24} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-xs font-bold uppercase tracking-wider text-accent">
          {t('continueLabel')}
        </span>
        <span className="truncate text-lg font-bold">{title}</span>
        {total !== null ? (
          <span className="flex items-center gap-3">
            <span
              role="progressbar"
              aria-label={t('continueProgressLabel')}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={done}
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"
            >
              <span
                className="block h-full rounded-full bg-warm"
                style={{ width: `${(done / total) * 100}%` }}
              />
            </span>
            <span className="text-sm font-semibold text-ink-muted">
              {done}/{total}
            </span>
          </span>
        ) : (
          countLabel && <span className="text-sm font-semibold text-ink-muted">{countLabel}</span>
        )}
      </span>
    </button>
  );
}
