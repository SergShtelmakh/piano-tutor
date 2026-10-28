import { describe, expect, it } from 'vitest';
import {
  ALLOWED_LICENCES,
  browse,
  type BrowseOptions,
  DIFFICULTIES,
  formatDuration,
  initials,
  PORTRAIT_HOST,
  PORTRAIT_LICENCES,
  pieceFile,
  portraitUrl,
  pieceUrl,
  SOURCE_HOST,
} from './library.ts';
import { LIBRARY_COMPOSERS, LIBRARY_PIECES, type LibraryPiece } from './libraryCatalog.ts';
import type { LibraryComposer } from './libraryCatalog.ts';

const nameOf = (composer: LibraryComposer) => composer.nameKey;
const NO_FILTER: BrowseOptions = { difficulty: null, favouritesOnly: false };

function sections(options: BrowseOptions = NO_FILTER, favourites: string[] = [], locale = 'en') {
  return browse(LIBRARY_PIECES, LIBRARY_COMPOSERS, options, favourites, nameOf, locale);
}

describe('the catalogue: licence policy', () => {
  it('only holds Public Domain pieces from the Mutopia Project', () => {
    for (const piece of LIBRARY_PIECES) {
      expect(ALLOWED_LICENCES, piece.id).toContain(piece.source.licence);
      const url = new URL(piece.source.url);
      expect(url.protocol, piece.id).toBe('https:');
      expect(url.hostname, piece.id).toBe(SOURCE_HOST);
      expect(url.searchParams.get('id'), piece.id).toMatch(/^\d+$/);
    }
  });

  it('records the day every licence was checked', () => {
    for (const piece of LIBRARY_PIECES) {
      expect(piece.source.checkedOn, piece.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(piece.source.checkedOn)), piece.id).toBe(false);
    }
  });

  it('allows nothing but Public Domain', () => {
    expect(ALLOWED_LICENCES).toEqual(['Public Domain']);
  });
});

describe('the catalogue: shape', () => {
  it('has unique ids that match the composer and the file name', () => {
    const ids = LIBRARY_PIECES.map((piece) => piece.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const piece of LIBRARY_PIECES) {
      expect(piece.id).toBe(`${piece.composer}/${piece.slug}`);
      expect(piece.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('gives every piece a known composer, a title, a difficulty from 1 to 5, and a duration', () => {
    const composers = new Set(LIBRARY_COMPOSERS.map((composer) => composer.id));
    for (const piece of LIBRARY_PIECES) {
      expect(composers.has(piece.composer), piece.id).toBe(true);
      expect(piece.title.trim().length, piece.id).toBeGreaterThan(0);
      expect(DIFFICULTIES, piece.id).toContain(piece.difficulty);
      expect(Number.isInteger(piece.duration), piece.id).toBe(true);
      expect(piece.duration, piece.id).toBeGreaterThan(0);
      expect(piece.duration, piece.id).toBeLessThanOrEqual(8 * 60);
    }
  });

  it('has unique composers, each with at least one piece and sensible years', () => {
    const ids = LIBRARY_COMPOSERS.map((composer) => composer.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const composer of LIBRARY_COMPOSERS) {
      expect(
        LIBRARY_PIECES.some((piece) => piece.composer === composer.id),
        composer.id,
      ).toBe(true);
      expect(composer.born).toBeLessThan(composer.died);
    }
  });
});

describe('the catalogue: coverage', () => {
  it('has 24 to 40 pieces by at least 8 composers', () => {
    expect(LIBRARY_PIECES.length).toBeGreaterThanOrEqual(24);
    expect(LIBRARY_PIECES.length).toBeLessThanOrEqual(40);
    expect(LIBRARY_COMPOSERS.length).toBeGreaterThanOrEqual(8);
  });

  it('covers every level, with at least 4 pieces at levels 1 to 3', () => {
    const count = (level: number) => LIBRARY_PIECES.filter((p) => p.difficulty === level).length;
    for (const level of DIFFICULTIES)
      expect(count(level), `level ${level}`).toBeGreaterThanOrEqual(2);
    for (const level of [1, 2, 3]) expect(count(level), `level ${level}`).toBeGreaterThanOrEqual(4);
  });
});

describe('pieceFile and pieceUrl', () => {
  const piece = { composer: 'bach', slug: 'bwv-515-aria' };

  it('builds the file path and the URL under the base path', () => {
    expect(pieceFile(piece)).toBe('bach/bwv-515-aria.mid');
    expect(pieceUrl('/', piece)).toBe('/library/bach/bwv-515-aria.mid');
    expect(pieceUrl('/piano-tutor/', piece)).toBe('/piano-tutor/library/bach/bwv-515-aria.mid');
    expect(pieceUrl('/piano-tutor', piece)).toBe('/piano-tutor/library/bach/bwv-515-aria.mid');
  });
});

describe('browse', () => {
  it('lists every piece when nothing is filtered, grouped by composer', () => {
    const all = sections();
    expect(all.flatMap((section) => section.pieces)).toHaveLength(LIBRARY_PIECES.length);
    for (const section of all) {
      expect(section.pieces.every((p) => p.composer === section.composer.id)).toBe(true);
    }
  });

  it('orders composers by their displayed name in the given language', () => {
    const names = (locale: string) =>
      browse(
        LIBRARY_PIECES,
        LIBRARY_COMPOSERS,
        NO_FILTER,
        [],
        (composer) => ({ bach: 'Zeta', beethoven: 'Alpha' })[composer.id] ?? composer.id,
        locale,
      ).map((section) => section.composer.id);
    expect(names('en')[0]).toBe('beethoven'); // "Alpha" before everything else
    expect(names('en')[names('en').length - 1]).toBe('bach'); // "Zeta" after "schumann"
  });

  it('orders pieces by difficulty, then by title', () => {
    for (const section of sections()) {
      const keys = section.pieces.map((p) => [p.difficulty, p.title] as const);
      const sorted = [...keys].sort((a, b) => a[0] - b[0] || a[1].localeCompare(b[1], 'en'));
      expect(keys).toEqual(sorted);
    }
  });

  it('filters by difficulty and drops composers with no match', () => {
    const level = sections({ difficulty: 5, favouritesOnly: false });
    const pieces = level.flatMap((section) => section.pieces);
    expect(pieces.length).toBeGreaterThan(0);
    expect(pieces.every((p) => p.difficulty === 5)).toBe(true);
    expect(level.every((section) => section.pieces.length > 0)).toBe(true);
    expect(level.length).toBeLessThan(sections().length);
  });

  it('shows only favourites when asked', () => {
    const favourites = [LIBRARY_PIECES[0].id, LIBRARY_PIECES[7].id];
    const shown = sections({ difficulty: null, favouritesOnly: true }, favourites);
    expect(shown.flatMap((s) => s.pieces.map((p) => p.id)).sort()).toEqual([...favourites].sort());
  });

  it('combines the filters', () => {
    const first = LIBRARY_PIECES[0];
    const same = sections({ difficulty: first.difficulty, favouritesOnly: true }, [first.id]);
    expect(same.flatMap((s) => s.pieces)).toEqual([first]);
    const other = (first.difficulty % 5) + 1;
    expect(
      sections({ difficulty: other as LibraryPiece['difficulty'], favouritesOnly: true }, [
        first.id,
      ]),
    ).toEqual([]);
  });

  it('returns nothing when no favourite exists', () => {
    expect(sections({ difficulty: null, favouritesOnly: true }, [])).toEqual([]);
  });

  it('ignores favourites that are not in the library', () => {
    expect(sections({ difficulty: null, favouritesOnly: true }, ['nobody/nothing'])).toEqual([]);
  });
});

describe('formatDuration', () => {
  it('formats seconds as m:ss', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(27)).toBe('0:27');
    expect(formatDuration(60)).toBe('1:00');
    expect(formatDuration(254)).toBe('4:14');
    expect(formatDuration(599.6)).toBe('10:00');
  });
});

describe('the catalogue: portraits', () => {
  it('gives every composer a portrait with a public-domain licence from Wikimedia Commons', () => {
    for (const composer of LIBRARY_COMPOSERS) {
      const { portrait } = composer;
      expect(portrait.file, composer.id).toBe(`portraits/${composer.id}.jpg`);
      expect(PORTRAIT_LICENCES, composer.id).toContain(portrait.source.licence);
      const url = new URL(portrait.source.url);
      expect(url.protocol, composer.id).toBe('https:');
      expect(url.hostname, composer.id).toBe(PORTRAIT_HOST);
      expect(url.pathname, composer.id).toMatch(/^\/wiki\/File:./);
      expect(portrait.source.author.trim().length, composer.id).toBeGreaterThan(0);
      expect(portrait.source.year, composer.id).toMatch(/\d{4}/);
      expect(portrait.source.checkedOn, composer.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('allows nothing but public-domain portraits', () => {
    expect(PORTRAIT_LICENCES).toEqual(['Public domain', 'CC0']);
  });
});

describe('portraitUrl', () => {
  it('builds the URL under the base path', () => {
    const portrait = { file: 'portraits/bach.jpg' };
    expect(portraitUrl('/', portrait)).toBe('/library/portraits/bach.jpg');
    expect(portraitUrl('/piano-tutor/', portrait)).toBe('/piano-tutor/library/portraits/bach.jpg');
    expect(portraitUrl('/piano-tutor', portrait)).toBe('/piano-tutor/library/portraits/bach.jpg');
  });
});

describe('initials', () => {
  it('takes the first letter of the first and the last capitalised word', () => {
    expect(initials('Johann Sebastian Bach')).toBe('JB');
    expect(initials('Ludwig van Beethoven')).toBe('LB');
    expect(initials('Wolfgang Amadeus Mozart')).toBe('WM');
  });

  it('works with Cyrillic, accents, and a single name', () => {
    expect(initials('Фридерик Шопен')).toBe('ФШ');
    expect(initials('Frédéric Chopin')).toBe('FC');
    expect(initials('Haydn')).toBe('H');
    expect(initials('')).toBe('');
  });
});
