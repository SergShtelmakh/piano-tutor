import { useEffect, useState } from 'react';
import { LIBRARY_COMPOSERS, LIBRARY_PIECES, type LibraryPiece } from '../core/libraryCatalog.ts';
import {
  entriesWithoutCount,
  entryProgress,
  filterBySource,
  orderedEntries,
  type MyLessonEntry,
  type SourceFilter,
} from '../core/myLessons.ts';
import { useCourse } from '../course/context.ts';
import { useLocale, usePluralT, useT } from '../i18n/context.ts';
import { formatPercent } from '../i18n/core.ts';
import { useMyLessons } from '../myLessons/context.ts';
import { countLessons } from '../myLessons/countLessons.ts';
import { useProgress } from '../progress/context.ts';
import { FileIcon, NoteIcon, TrashIcon } from './icons.tsx';
import {
  buttonDanger,
  buttonIcon,
  buttonOutline,
  buttonSmall,
  card,
  chip,
  chipOn,
  notice,
} from './ui.ts';

const FILTERS: readonly SourceFilter[] = ['all', 'file', 'library'];

/** The pieces the learner is learning: source chips, a row per piece with its progress, Remove. */
export default function MyLessonsList() {
  const t = useT();
  const tp = usePluralT();
  const { locale } = useLocale();
  const { progress } = useProgress();
  const { openCourse, openStoredFile } = useCourse();
  const { entries, remove, setLessonCount, loadFileSource } = useMyLessons();
  const [filter, setFilter] = useState<SourceFilter>('all');
  const [removing, setRemoving] = useState<string | null>(null);

  // Rows without a lesson count get one in the background, one at a time, once per visit.
  const [attempted, setAttempted] = useState<ReadonlySet<string>>(new Set());
  const pendingId = entriesWithoutCount(entries).find((item) => !attempted.has(item.id))?.id;
  useEffect(() => {
    if (!pendingId) return;
    const entry = entries.find((item) => item.id === pendingId);
    if (!entry) return;
    void countLessons(entry, loadFileSource).then((count) => {
      if (count !== null) setLessonCount(pendingId, count);
      setAttempted((current) => new Set(current).add(pendingId));
    });
    // `entries` only supplies the entry of this id; the effect must run once per pending id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingId, loadFileSource, setLessonCount]);

  // A library entry whose piece left the catalogue has nothing to show or open.
  const known = entries.filter(
    (item) => item.source === 'file' || LIBRARY_PIECES.some((piece) => piece.id === item.id),
  );
  const shown = orderedEntries(filterBySource(known, filter));

  const filterLabels: Record<SourceFilter, string> = {
    all: t('libraryAll'),
    file: t('myLessonsFromFile'),
    library: t('myLessonsFromLibrary'),
  };

  const open = (entry: MyLessonEntry, piece: LibraryPiece | undefined) => {
    if (piece) openCourse(piece);
    else openStoredFile({ id: entry.id, title: entry.title });
  };

  return (
    <section className="flex w-full flex-col gap-3">
      <div
        role="group"
        aria-label={t('myLessonsFilterLabel')}
        className="flex gap-2 overflow-x-auto pb-1"
      >
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={filter === item}
            onClick={() => setFilter(item)}
            className={`${filter === item ? chipOn : chip} shrink-0 whitespace-nowrap`}
          >
            {filterLabels[item]}
          </button>
        ))}
      </div>

      {shown.length === 0 && (
        <p className={`${notice} text-left`}>
          {known.length === 0 ? t('myLessonsEmpty') : t('myLessonsEmptyFilter')}
        </p>
      )}

      {shown.map((entry) => {
        const piece =
          entry.source === 'library'
            ? LIBRARY_PIECES.find((item) => item.id === entry.id)
            : undefined;
        const title = piece ? piece.title : entry.title;
        const composer = piece && LIBRARY_COMPOSERS.find((item) => item.id === piece.composer);
        const { finished, percent } = entryProgress(entry, progress.lessons);
        const sourceLine = piece
          ? `${composer ? `${t(composer.nameKey)} · ` : ''}${t('myLessonsFromLibrary')}`
          : `${entry.fileName} · ${t('myLessonsFromFile')}`;
        const detail = percent === null && finished > 0 ? tp('homePieceFinished', finished) : null;

        if (removing === entry.id) {
          return (
            <article
              key={entry.id}
              role="alertdialog"
              aria-label={t('myLessonsRemoveLabel', { title })}
              className={`${card} flex flex-col items-start gap-3 p-4 text-left`}
            >
              <p className="text-sm text-ink">
                {t(
                  entry.source === 'file' ? 'myLessonsRemoveConfirmFile' : 'myLessonsRemoveConfirm',
                  {
                    title,
                  },
                )}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  className={`${buttonDanger} ${buttonSmall}`}
                  onClick={() => {
                    setRemoving(null);
                    void remove(entry.id);
                  }}
                >
                  {t('myLessonsRemove')}
                </button>
                <button
                  type="button"
                  className={`${buttonOutline} ${buttonSmall}`}
                  onClick={() => setRemoving(null)}
                >
                  {t('myLessonsCancel')}
                </button>
              </div>
            </article>
          );
        }

        return (
          <article
            key={entry.id}
            className={`${card} flex w-full items-center gap-2 p-2 text-left`}
          >
            <button
              type="button"
              onClick={() => open(entry, piece)}
              className="flex min-h-14 min-w-0 flex-1 items-center gap-4 rounded-xl p-2 text-left hover:bg-surface-raised"
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-raised ${
                  piece ? 'text-warm' : 'text-accent'
                }`}
              >
                {piece ? <NoteIcon size={24} /> : <FileIcon size={24} />}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-base font-bold">{title}</span>
                <span className="truncate text-sm text-ink-muted">
                  {sourceLine}
                  {detail && ` · ${detail}`}
                </span>
                <span
                  role="progressbar"
                  aria-label={title}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percent ?? 0}
                  className="mt-1 block h-1 overflow-hidden rounded-full bg-line"
                >
                  <span
                    className="block h-full rounded-full bg-warm"
                    style={{ width: `${percent ?? 0}%` }}
                  />
                </span>
              </span>
              <span className="shrink-0 text-sm font-bold text-ink">
                {finished === 0
                  ? t('myLessonsNew')
                  : percent !== null
                    ? formatPercent(locale, percent / 100)
                    : ''}
              </span>
            </button>
            <button
              type="button"
              className={buttonIcon}
              aria-label={t('myLessonsRemoveLabel', { title })}
              onClick={() => setRemoving(entry.id)}
            >
              <TrashIcon size={22} />
            </button>
          </article>
        );
      })}
    </section>
  );
}
