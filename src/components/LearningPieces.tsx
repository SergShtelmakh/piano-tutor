import { piecesInProgress } from '../core/course.ts';
import { LIBRARY_COMPOSERS, LIBRARY_PIECES } from '../core/libraryCatalog.ts';
import { useCourse } from '../course/context.ts';
import { usePluralT, useT } from '../i18n/context.ts';
import { useProgress } from '../progress/context.ts';
import { LibraryIcon } from './icons.tsx';
import { buttonPrimary, buttonSmall, card, sectionLabel } from './ui.ts';

/** The pieces the learner has started to learn, with a way back into their course. */
export default function LearningPieces() {
  const t = useT();
  const tp = usePluralT();
  const { progress } = useProgress();
  const { openCourse } = useCourse();
  const pieces = piecesInProgress(progress.lessons, LIBRARY_PIECES);
  if (pieces.length === 0) return null;

  return (
    <section className="flex w-full flex-col gap-3">
      <h2 className={`${sectionLabel} text-left`}>{t('homePiecesTitle')}</h2>
      {pieces.map(({ piece, finished }) => {
        const composer = LIBRARY_COMPOSERS.find((item) => item.id === piece.composer);
        return (
          <article
            key={piece.id}
            className={`${card} flex w-full items-center gap-4 p-4 text-left`}
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-raised text-warm">
              <LibraryIcon size={24} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h3 className="text-base font-bold">{piece.title}</h3>
              <p className="text-sm text-ink-muted">
                {composer ? `${t(composer.nameKey)} · ` : ''}
                {tp('homePieceFinished', finished)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => openCourse(piece)}
              className={`${buttonPrimary} ${buttonSmall}`}
            >
              {t('homePieceContinue')}
            </button>
          </article>
        );
      })}
    </section>
  );
}
