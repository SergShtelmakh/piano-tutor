import { LESSON_CATALOG, nextLessonId } from '../core/lessons.ts';
import { useT } from '../i18n/context.ts';
import { useProgress } from '../progress/context.ts';
import { PlayIcon } from './icons.tsx';
import { card } from './ui.ts';

/** Opens the next lesson without a finished run (the one with the Next badge). Hidden when none is left. */
export default function ContinueCard({ onStart }: { onStart: (lessonId: string) => void }) {
  const t = useT();
  const { progress } = useProgress();
  const nextId = nextLessonId(LESSON_CATALOG, progress.lessons);
  const entry = LESSON_CATALOG.find((item) => item.id === nextId);
  if (!entry) return null;

  const done = LESSON_CATALOG.filter((item) => progress.lessons[item.id] !== undefined).length;

  return (
    <button
      type="button"
      onClick={() => onStart(entry.id)}
      className={`${card} flex w-full items-center gap-4 p-4 text-left hover:bg-surface-raised`}
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink">
        <PlayIcon size={24} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-xs font-bold uppercase tracking-wider text-accent">
          {t('continueLabel')}
        </span>
        <span className="truncate text-lg font-bold">{t(entry.titleKey)}</span>
        <span className="flex items-center gap-3">
          <span
            role="progressbar"
            aria-label={t('continueProgressLabel')}
            aria-valuemin={0}
            aria-valuemax={LESSON_CATALOG.length}
            aria-valuenow={done}
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"
          >
            <span
              className="block h-full rounded-full bg-warm"
              style={{ width: `${(done / LESSON_CATALOG.length) * 100}%` }}
            />
          </span>
          <span className="text-sm font-semibold text-ink-muted">
            {done}/{LESSON_CATALOG.length}
          </span>
        </span>
      </span>
    </button>
  );
}
