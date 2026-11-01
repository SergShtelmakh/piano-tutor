import { useMemo, useState } from 'react';
import {
  browse,
  DIFFICULTIES,
  DIFFICULTY_KEYS,
  formatDuration,
  PORTRAIT_HOME_URL,
  SOURCE_HOME_URL,
} from '../core/library.ts';
import {
  LIBRARY_COMPOSERS,
  LIBRARY_PIECES,
  type Difficulty,
  type LibraryPiece,
} from '../core/libraryCatalog.ts';
import { useLocale, useT } from '../i18n/context.ts';
import { useCourse } from '../course/context.ts';
import { useLibraryMarks } from '../library/context.ts';
import { usePlayerValue } from '../playback/context.ts';
import DifficultyDots from './DifficultyDots.tsx';
import MarkToggles from './MarkToggles.tsx';
import Portrait from './Portrait.tsx';

const chip = 'min-h-11 rounded-full border px-4 text-sm font-bold';
const chipOn = 'border-accent bg-accent text-accent-ink';
const chipOff = 'border-line bg-transparent text-ink-muted hover:text-ink';

/** The library of pieces: a filter, then a section per composer. Choosing a piece opens it. */
export default function LibraryPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const t = useT();
  const { locale } = useLocale();
  const { marks } = useLibraryMarks();
  const { loading, openLibraryPiece } = usePlayerValue();
  const { openCourse } = useCourse();
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());

  const sections = useMemo(
    () =>
      browse(
        LIBRARY_PIECES,
        LIBRARY_COMPOSERS,
        { difficulty, favouritesOnly },
        marks.favourites,
        (composer) => t(composer.nameKey),
        locale,
      ),
    [difficulty, favouritesOnly, marks.favourites, t, locale],
  );

  const toggleSection = (composerId: string) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (!next.delete(composerId)) next.add(composerId);
      return next;
    });

  const choose = async (piece: LibraryPiece) => {
    if (await openLibraryPiece(piece)) onClose();
  };

  const learn = (piece: LibraryPiece) => {
    openCourse(piece);
    onClose();
  };

  const [creditBefore, creditAfter] = t('libraryCredit').split('{link}');
  const [portraitBefore, portraitAfter] = t('libraryPortraitCredit').split('{link}');

  return (
    <section
      id={id}
      aria-label={t('playerLibrary')}
      className="flex w-full flex-col gap-4 rounded-2xl border border-line bg-surface p-4 text-left"
    >
      <div className="flex flex-col gap-2">
        <div role="group" aria-label={t('libraryDifficultyLabel')} className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={difficulty === null}
            onClick={() => setDifficulty(null)}
            className={`${chip} ${difficulty === null ? chipOn : chipOff}`}
          >
            {t('libraryAll')}
          </button>
          {DIFFICULTIES.map((level) => (
            <button
              key={level}
              type="button"
              aria-pressed={difficulty === level}
              onClick={() => setDifficulty(level)}
              className={`${chip} ${difficulty === level ? chipOn : chipOff}`}
            >
              {level} · {t(DIFFICULTY_KEYS[level])}
            </button>
          ))}
        </div>
        <div>
          <button
            type="button"
            aria-pressed={favouritesOnly}
            onClick={() => setFavouritesOnly((current) => !current)}
            className={`${chip} ${favouritesOnly ? chipOn : chipOff}`}
          >
            <span aria-hidden="true">{favouritesOnly ? '★' : '☆'}</span> {t('libraryFavourites')}
          </button>
        </div>
      </div>

      {sections.length === 0 && <p className="text-ink-muted">{t('libraryNoMatch')}</p>}

      {sections.map(({ composer, pieces }) => {
        const open = !collapsed.has(composer.id);
        return (
          <div key={composer.id} className="flex flex-col gap-2">
            <h3>
              <button
                type="button"
                aria-expanded={open}
                onClick={() => toggleSection(composer.id)}
                className="flex min-h-11 w-full items-center gap-2 rounded-xl bg-surface-raised px-3 text-left font-bold text-ink hover:bg-line"
              >
                <span aria-hidden="true">{open ? '▾' : '▸'}</span>
                <Portrait composer={composer} size="small" />
                <span>
                  {t(composer.nameKey)} · {composer.born}–{composer.died}
                </span>
              </button>
            </h3>
            {open && (
              <ul className="flex flex-col gap-2">
                {pieces.map((piece) => (
                  <li key={piece.id} className="flex flex-wrap items-stretch gap-2">
                    <button
                      type="button"
                      onClick={() => void choose(piece)}
                      className="flex min-h-11 min-w-0 flex-1 flex-col items-start gap-1 rounded-xl border border-line px-3 py-2 text-left hover:bg-surface-raised"
                    >
                      <span className="font-semibold text-ink">{piece.title}</span>
                      <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
                        <DifficultyDots level={piece.difficulty} />
                        <span className="tabular-nums">{formatDuration(piece.duration)}</span>
                        {loading === piece.id && <span>{t('libraryLoading')}</span>}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => learn(piece)}
                      className="min-h-11 rounded-xl bg-accent px-4 text-sm font-extrabold text-accent-ink hover:bg-accent-strong"
                    >
                      {t('libraryLearn')}
                    </button>
                    <MarkToggles piece={piece} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

      <p className="text-sm text-ink-muted">
        {creditBefore}
        <a
          href={SOURCE_HOME_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline hover:text-accent-strong"
        >
          Mutopia Project
        </a>
        {creditAfter}
      </p>
      <p className="text-sm text-ink-muted">
        {portraitBefore}
        <a
          href={PORTRAIT_HOME_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline hover:text-accent-strong"
        >
          Wikimedia Commons
        </a>
        {portraitAfter}
      </p>
    </section>
  );
}
