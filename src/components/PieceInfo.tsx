import { LIBRARY_COMPOSERS, type LibraryPiece } from '../core/libraryCatalog.ts';
import { useCourse } from '../course/context.ts';
import { useT } from '../i18n/context.ts';
import DifficultyDots from './DifficultyDots.tsx';
import MarkToggles from './MarkToggles.tsx';
import Portrait from './Portrait.tsx';

/** The title, composer, difficulty, source, and marks of the library piece that is open. */
export default function PieceInfo({ piece }: { piece: LibraryPiece }) {
  const t = useT();
  const { openCourse } = useCourse();
  const composer = LIBRARY_COMPOSERS.find((item) => item.id === piece.composer);

  return (
    <section className="flex w-full flex-col items-start gap-2 rounded-2xl border border-line bg-surface px-4 py-4 text-left">
      {composer && <Portrait key={composer.id} composer={composer} size="large" />}
      <h3 className="text-lg font-semibold">{piece.title}</h3>
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink">
        {composer && <span>{t(composer.nameKey)}</span>}
        <DifficultyDots level={piece.difficulty} />
      </p>
      <p className="text-sm text-ink-muted">
        {t('librarySource')}:{' '}
        <a
          href={piece.source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline hover:text-accent-strong"
        >
          Mutopia Project
        </a>{' '}
        · {t('libraryLicencePublicDomain')}
      </p>
      <span className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => openCourse(piece)}
          className="min-h-11 rounded-xl bg-accent px-4 text-sm font-extrabold text-accent-ink hover:bg-accent-strong"
        >
          {t('libraryLearn')}
        </button>
        <MarkToggles piece={piece} labelled />
      </span>
    </section>
  );
}
