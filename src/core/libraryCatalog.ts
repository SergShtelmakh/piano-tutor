// The library of public-domain classical pieces. Pure data: the files are in `public/library/`.
// Every piece comes from the Mutopia Project, and only pieces whose own Mutopia page says
// "Public Domain" are allowed. The record is also in `licenses/library-sources.md`, and
// `library.test.ts` enforces the rules.
import type { MessageKey } from '../i18n/locales/en.ts';

export type Difficulty = 1 | 2 | 3 | 4 | 5;

/** A public-domain portrait from Wikimedia Commons, saved as a small square JPEG. */
export interface LibraryPortrait {
  /** Relative to `public/library/`. */
  file: string;
  source: {
    /** The file's page on Wikimedia Commons. */
    url: string;
    author: string;
    year: string;
    /** The licence field of the Commons page. */
    licence: 'Public domain' | 'CC0';
    /** The day the licence was read on that page (YYYY-MM-DD). */
    checkedOn: string;
  };
}

export interface LibraryComposer {
  /** Also the folder under `public/library/`. */
  id: string;
  nameKey: MessageKey;
  born: number;
  died: number;
  portrait: LibraryPortrait;
}

export interface LibraryPiece {
  /** `<composer>/<slug>`: stable, and the key of the learner's marks. */
  id: string;
  composer: string;
  /** The file name without `.mid`: lower case, digits, and hyphens only. */
  slug: string;
  /** The usual name of the work, with its opus or catalogue number. Not translated. */
  title: string;
  difficulty: Difficulty;
  /** Whole seconds at the file's own tempo; a test checks it against the file. */
  duration: number;
  source: {
    /** The piece's own page on the Mutopia Project. */
    url: string;
    licence: 'Public Domain';
    /** The day the licence was read on that page (YYYY-MM-DD). */
    checkedOn: string;
  };
}

const CHECKED_ON = '2026-10-28';

function portrait(
  composer: string,
  commonsFile: string,
  author: string,
  year: string,
): LibraryPortrait {
  return {
    file: `portraits/${composer}.jpg`,
    source: {
      url: `https://commons.wikimedia.org/wiki/File:${commonsFile}`,
      author,
      year,
      licence: 'Public domain',
      checkedOn: CHECKED_ON,
    },
  };
}

export const LIBRARY_COMPOSERS: readonly LibraryComposer[] = [
  {
    id: 'bach',
    nameKey: 'composerBach',
    born: 1685,
    died: 1750,
    portrait: portrait('bach', 'Johann_Sebastian_Bach.jpg', 'Elias Gottlob Haussmann', '1748'),
  },
  {
    id: 'beethoven',
    nameKey: 'composerBeethoven',
    born: 1770,
    died: 1827,
    portrait: portrait('beethoven', 'Beethoven.jpg', 'Joseph Karl Stieler', '1820'),
  },
  {
    id: 'brahms',
    nameKey: 'composerBrahms',
    born: 1833,
    died: 1897,
    portrait: portrait('brahms', 'JohannesBrahms.jpg', 'C. Brasch', '1889'),
  },
  {
    id: 'burgmuller',
    nameKey: 'composerBurgmuller',
    born: 1806,
    died: 1874,
    portrait: portrait('burgmuller', 'Friedrich_Burgmüller.jpg', 'Fr. Meyer', 'c. 1840'),
  },
  {
    id: 'chopin',
    nameKey: 'composerChopin',
    born: 1810,
    died: 1849,
    portrait: portrait('chopin', 'Frederic_Chopin_photo.jpeg', 'Louis-Auguste Bisson', '1849'),
  },
  {
    id: 'handel',
    nameKey: 'composerHandel',
    born: 1685,
    died: 1759,
    portrait: portrait(
      'handel',
      'George_Frideric_Handel_by_Balthasar_Denner.jpg',
      'Balthasar Denner (attributed)',
      'c. 1727',
    ),
  },
  {
    id: 'haydn',
    nameKey: 'composerHaydn',
    born: 1732,
    died: 1809,
    portrait: portrait('haydn', 'Joseph_Haydn.jpg', 'Thomas Hardy', '1791'),
  },
  {
    id: 'mozart',
    nameKey: 'composerMozart',
    born: 1756,
    died: 1791,
    portrait: portrait('mozart', 'Wolfgang-amadeus-mozart_1.jpg', 'Barbara Krafft', '1819'),
  },
  {
    id: 'schubert',
    nameKey: 'composerSchubert',
    born: 1797,
    died: 1828,
    portrait: portrait('schubert', 'Franz_Schubert.jpg', 'Josef Kriehuber', '1846'),
  },
  {
    id: 'schumann',
    nameKey: 'composerSchumann',
    born: 1810,
    died: 1856,
    portrait: portrait('schumann', 'Robert_Schumann_1839.jpg', 'Josef Kriehuber', '1839'),
  },
];

function piece(
  composer: string,
  slug: string,
  mutopiaId: number,
  title: string,
  difficulty: Difficulty,
  duration: number,
): LibraryPiece {
  return {
    id: `${composer}/${slug}`,
    composer,
    slug,
    title,
    difficulty,
    duration,
    source: {
      url: `https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=${mutopiaId}`,
      licence: 'Public Domain',
      checkedOn: CHECKED_ON,
    },
  };
}

export const LIBRARY_PIECES: readonly LibraryPiece[] = [
  piece('bach', 'bwv-515-aria', 78, 'Aria, BWV 515', 1, 27),
  piece(
    'bach',
    'bwv-269-aus-meines-herzens-grunde',
    378,
    'Aus meines Herzens Grunde, BWV 269',
    2,
    52,
  ),
  piece(
    'bach',
    'bwv-347-ich-dank-dir-lieber-herre',
    379,
    'Ich dank dir, lieber Herre, BWV 347',
    2,
    43,
  ),
  piece('bach', 'bwv-anh-117a-polonaise-in-f', 1013, 'Polonaise in F major, BWV Anh. 117a', 2, 48),
  piece('bach', 'bwv-846-prelude-in-c', 5, 'Prelude in C major, BWV 846', 3, 140),
  piece('bach', 'bwv-773-invention-2', 58, 'Invention No. 2 in C minor, BWV 773', 4, 101),

  piece('beethoven', 'woo-59-fur-elise', 931, 'Für Elise, WoO 59', 3, 130),
  piece(
    'beethoven',
    'op-49-2-tempo-di-menuetto',
    777,
    'Sonata No. 20, Op. 49 No. 2: II. Tempo di Menuetto',
    3,
    161,
  ),
  piece(
    'beethoven',
    'op-49-2-allegro',
    776,
    'Sonata No. 20, Op. 49 No. 2: I. Allegro, ma non troppo',
    4,
    205,
  ),
  piece(
    'beethoven',
    'op-13-adagio-cantabile',
    295,
    'Sonata No. 8 “Pathétique”, Op. 13: II. Adagio cantabile',
    4,
    243,
  ),

  piece('brahms', 'op-39-15-waltz', 794, 'Waltz in A-flat major, Op. 39 No. 15', 3, 68),
  piece('brahms', 'op-39-10-waltz', 2164, 'Waltz, Op. 39 No. 10', 4, 36),

  piece('burgmuller', 'op-100-01-la-candeur', 202, 'La Candeur, Op. 100 No. 1', 1, 36),
  piece('burgmuller', 'op-100-05-innocence', 214, 'Innocence, Op. 100 No. 5', 1, 27),
  piece('burgmuller', 'op-100-03-la-pastorale', 218, 'La Pastorale, Op. 100 No. 3', 2, 51),
  piece('burgmuller', 'op-100-02-l-arabesque', 203, 'L’Arabesque, Op. 100 No. 2', 3, 26),
  piece('burgmuller', 'op-100-06-progres', 215, 'Progrès, Op. 100 No. 6', 1, 29),

  piece('chopin', 'op-28-07-prelude', 470, 'Prelude in A major, Op. 28 No. 7', 2, 24),
  piece('chopin', 'op-28-04-prelude', 468, 'Prelude in E minor, Op. 28 No. 4', 3, 108),
  piece(
    'chopin',
    'op-64-01-minute-waltz',
    483,
    'Minute Waltz in D-flat major, Op. 64 No. 1',
    4,
    90,
  ),
  piece('chopin', 'op-10-01-etude', 914, 'Étude in C major, Op. 10 No. 1', 5, 108),
  piece('chopin', 'op-10-12-etude', 743, 'Étude in C minor “Revolutionary”, Op. 10 No. 12', 5, 125),
  piece(
    'chopin',
    'op-66-fantaisie-impromptu',
    1693,
    'Fantaisie-Impromptu in C-sharp minor, Op. 66',
    5,
    254,
  ),

  piece('handel', 'hwv-585-sonatina-in-b-flat', 98, 'Sonatina in B-flat major, HWV 585', 2, 38),
  piece('handel', 'menuet', 161, 'Menuet', 1, 60),

  piece('haydn', 'hob-xvi-27-menuetto', 186, 'Sonata Hob. XVI:27: II. Menuetto', 3, 129),

  piece('mozart', 'kv-331-theme', 614, 'Sonata in A major, K. 331: I. Theme', 3, 115),
  piece('mozart', 'kv-574-gigue', 239, 'Gigue in G major, K. 574', 3, 49),
  piece('mozart', 'kv-309-first-movement', 1379, 'Sonata in C major, K. 309: I. Allegro', 4, 256),

  piece(
    'schubert',
    'd-780-moments-musicaux-3',
    1023,
    'Moment musical No. 3 in F minor, D. 780',
    3,
    117,
  ),
  piece('schubert', 'd-817-ungarische-melodie', 758, 'Hungarian Melody in B minor, D. 817', 4, 163),

  piece(
    'schumann',
    'op-15-01-von-fremden-landern',
    354,
    'Von fremden Ländern und Menschen (Kinderszenen, Op. 15 No. 1)',
    3,
    37,
  ),
  piece('schumann', 'op-15-07-traumerei', 504, 'Träumerei (Kinderszenen, Op. 15 No. 7)', 3, 111),
  piece('schumann', 'op-28-02-romanze', 314, 'Romance in F-sharp major, Op. 28 No. 2', 4, 122),
];
