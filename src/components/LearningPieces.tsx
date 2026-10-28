import { piecesInProgress } from '../core/course.ts';
import { LIBRARY_COMPOSERS, LIBRARY_PIECES } from '../core/libraryCatalog.ts';
import { useCourse } from '../course/context.ts';
import { usePluralT, useT } from '../i18n/context.ts';
import { useProgress } from '../progress/context.ts';

/** The pieces the learner has started to learn, with a way back into their course. */
export default function LearningPieces() {
  const t = useT();
  const tp = usePluralT();
  const { progress } = useProgress();
  const { openCourse } = useCourse();
  const pieces = piecesInProgress(progress.lessons, LIBRARY_PIECES);
  if (pieces.length === 0) return null;

  return (
    <section className="flex w-full flex-col items-center gap-3">
      <h3 className="w-full text-left text-lg font-semibold text-slate-800">
        {t('homePiecesTitle')}
      </h3>
      {pieces.map(({ piece, finished }) => {
        const composer = LIBRARY_COMPOSERS.find((item) => item.id === piece.composer);
        return (
          <article
            key={piece.id}
            className="flex w-full flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-4 text-left shadow-sm"
          >
            <div className="flex flex-col gap-1">
              <h4 className="text-lg font-bold">{piece.title}</h4>
              <p className="text-sm text-slate-700">
                {composer ? `${t(composer.nameKey)} · ` : ''}
                {tp('homePieceFinished', finished)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => openCourse(piece)}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
            >
              {t('homePieceContinue')}
            </button>
          </article>
        );
      })}
    </section>
  );
}
