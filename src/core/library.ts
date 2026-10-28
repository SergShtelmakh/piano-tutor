// Pure: how the library is browsed. The catalogue itself is in `libraryCatalog.ts`.
import type { MessageKey } from '../i18n/locales/en.ts';
import type {
  Difficulty,
  LibraryComposer,
  LibraryPiece,
  LibraryPortrait,
} from './libraryCatalog.ts';

/** The only licence a piece may have. A piece with another licence fails the tests. */
export const ALLOWED_LICENCES: readonly string[] = ['Public Domain'];

/** Where the Mutopia Project lives: every source link must point there. */
export const SOURCE_HOST = 'www.mutopiaproject.org';
export const SOURCE_HOME_URL = `https://${SOURCE_HOST}/`;

/** The licences a portrait may have on its Wikimedia Commons page. */
export const PORTRAIT_LICENCES: readonly string[] = ['Public domain', 'CC0'];

/** Where the portraits come from: every portrait source link must point there. */
export const PORTRAIT_HOST = 'commons.wikimedia.org';
export const PORTRAIT_HOME_URL = `https://${PORTRAIT_HOST}/`;

export const DIFFICULTIES: readonly Difficulty[] = [1, 2, 3, 4, 5];

export const DIFFICULTY_KEYS: Record<Difficulty, MessageKey> = {
  1: 'difficulty1',
  2: 'difficulty2',
  3: 'difficulty3',
  4: 'difficulty4',
  5: 'difficulty5',
};

/** The URL of a composer's portrait; `base` is the app's base path. */
export function portraitUrl(base: string, portrait: Pick<LibraryPortrait, 'file'>): string {
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${prefix}library/${portrait.file}`;
}

/** The first letters of up to two words of a name, for a portrait that did not load. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((word) => /^\p{L}/u.test(word) && word !== word.toLowerCase())
    .map((word) => [...word][0])
    .filter((_, index, letters) => index === 0 || index === letters.length - 1)
    .join('');
}

/** The file of a piece, relative to `public/library/`. */
export function pieceFile(piece: Pick<LibraryPiece, 'composer' | 'slug'>): string {
  return `${piece.composer}/${piece.slug}.mid`;
}

/** The URL the app fetches a piece from; `base` is the app's base path (`/` or `/piano-tutor/`). */
export function pieceUrl(base: string, piece: Pick<LibraryPiece, 'composer' | 'slug'>): string {
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${prefix}library/${pieceFile(piece)}`;
}

export interface BrowseOptions {
  /** Show only this level, or every level for `null`. */
  difficulty: Difficulty | null;
  favouritesOnly: boolean;
}

export interface ComposerSection {
  composer: LibraryComposer;
  pieces: LibraryPiece[];
}

/**
 * The library as shown to the learner: filtered, grouped by composer (ordered by name in the
 * language of `locale`), and each composer's pieces ordered by difficulty, then title.
 * Composers with no matching piece are left out.
 */
export function browse(
  pieces: readonly LibraryPiece[],
  composers: readonly LibraryComposer[],
  options: BrowseOptions,
  favourites: readonly string[],
  nameOf: (composer: LibraryComposer) => string,
  locale: string,
): ComposerSection[] {
  const collator = new Intl.Collator(locale);
  const starred = new Set(favourites);
  const matching = pieces.filter(
    (piece) =>
      (options.difficulty === null || piece.difficulty === options.difficulty) &&
      (!options.favouritesOnly || starred.has(piece.id)),
  );

  return [...composers]
    .sort((a, b) => collator.compare(nameOf(a), nameOf(b)))
    .map((composer) => ({
      composer,
      pieces: matching
        .filter((piece) => piece.composer === composer.id)
        .sort((a, b) => a.difficulty - b.difficulty || collator.compare(a.title, b.title)),
    }))
    .filter((section) => section.pieces.length > 0);
}

/** A duration in seconds as `m:ss`. */
export function formatDuration(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}
