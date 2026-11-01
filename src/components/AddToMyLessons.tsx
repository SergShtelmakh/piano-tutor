import type { LibraryPiece } from '../core/libraryCatalog.ts';
import { useT } from '../i18n/context.ts';
import { useMyLessons } from '../myLessons/context.ts';
import { CheckIcon, PlusIcon } from './icons.tsx';

/** A round + that adds a library piece to My lessons, or a check mark once it is there. */
export default function AddToMyLessons({ piece }: { piece: Pick<LibraryPiece, 'id' | 'title'> }) {
  const t = useT();
  const { has, addLibraryPiece } = useMyLessons();

  if (has(piece.id)) {
    return (
      <span
        role="img"
        aria-label={`${t('libraryAdded')}: ${piece.title}`}
        className="flex h-11 w-11 shrink-0 items-center justify-center self-center rounded-full bg-accent-soft text-accent"
      >
        <CheckIcon size={22} />
      </span>
    );
  }
  return (
    <button
      type="button"
      aria-label={`${t('libraryAdd')}: ${piece.title}`}
      onClick={() => addLibraryPiece(piece)}
      className="flex h-11 w-11 shrink-0 items-center justify-center self-center rounded-full border-[1.5px] border-accent bg-transparent text-accent hover:bg-accent-soft"
    >
      <PlusIcon size={22} />
    </button>
  );
}
