import { LIBRARY_COMPOSERS, type LibraryPiece } from '../core/libraryCatalog.ts';
import { useT } from '../i18n/context.ts';
import DifficultyDots from './DifficultyDots.tsx';
import MarkToggles from './MarkToggles.tsx';
import Portrait from './Portrait.tsx';

/** The title, composer, difficulty, source, and marks of the library piece that is open. */
export default function PieceInfo({ piece }: { piece: LibraryPiece }) {
  const t = useT();
  const composer = LIBRARY_COMPOSERS.find((item) => item.id === piece.composer);

  return (
    <section className="flex w-full flex-col items-center gap-2 rounded-lg bg-white px-4 py-3 shadow-sm">
      {composer && <Portrait key={composer.id} composer={composer} size="large" />}
      <h3 className="text-lg font-semibold">{piece.title}</h3>
      <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-slate-700">
        {composer && <span>{t(composer.nameKey)}</span>}
        <DifficultyDots level={piece.difficulty} />
      </p>
      <p className="text-sm text-slate-600">
        {t('librarySource')}:{' '}
        <a
          href={piece.source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-700 underline hover:text-sky-900"
        >
          Mutopia Project
        </a>{' '}
        · {t('libraryLicencePublicDomain')}
      </p>
      <MarkToggles piece={piece} labelled />
    </section>
  );
}
