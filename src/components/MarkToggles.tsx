import type { LibraryPiece } from '../core/libraryCatalog.ts';
import { useT } from '../i18n/context.ts';
import { useLibraryMarks } from '../library/context.ts';

const base = 'min-h-11 rounded-xl border px-3 text-sm font-bold';
const on = 'border-accent bg-accent-soft text-accent';
const off = 'border-line bg-transparent text-ink hover:bg-surface-raised';

/**
 * The favourite (★) and done (✓) toggles of a piece. The symbol changes with the state (filled or
 * empty), and each button is a pressed-state toggle with a text name.
 */
export default function MarkToggles({
  piece,
  labelled = false,
}: {
  piece: LibraryPiece;
  /** Show the words next to the symbols (the info line), or the symbols alone (the list rows). */
  labelled?: boolean;
}) {
  const t = useT();
  const { marks, toggleFavourite, toggleDone } = useLibraryMarks();
  const favourite = marks.favourites.includes(piece.id);
  const done = marks.done.includes(piece.id);
  const favouriteName = t('libraryMarkFavourite');
  const doneName = t('libraryMarkDone');

  return (
    <span className="inline-flex gap-2">
      <button
        type="button"
        aria-pressed={favourite}
        aria-label={`${favouriteName}: ${piece.title}`}
        onClick={() => toggleFavourite(piece.id)}
        className={`${base} ${favourite ? on : off}`}
      >
        <span aria-hidden="true">{favourite ? '★' : '☆'}</span>
        {labelled && <span className="ml-1.5">{favouriteName}</span>}
      </button>
      <button
        type="button"
        aria-pressed={done}
        aria-label={`${doneName}: ${piece.title}`}
        onClick={() => toggleDone(piece.id)}
        className={`${base} ${done ? on : off}`}
      >
        <span aria-hidden="true">{done ? '☑' : '☐'}</span>
        {labelled && <span className="ml-1.5">{doneName}</span>}
      </button>
    </span>
  );
}
