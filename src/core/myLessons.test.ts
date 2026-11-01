import { describe, expect, it } from 'vitest';
import { lessonId } from './course.ts';
import { LESSON_CATALOG } from './lessons.ts';
import { LIBRARY_PIECES } from './libraryCatalog.ts';
import {
  addEntry,
  continueTarget,
  entriesWithoutCount,
  entryProgress,
  fileEntry,
  filterBySource,
  libraryEntry,
  markPlayed,
  migrateFromProgress,
  orderedEntries,
  parseMyLessons,
  removeEntry,
  serialiseMyLessons,
  setLessonCount,
  type MyLessonEntry,
} from './myLessons.ts';

const [a, b, c] = LIBRARY_PIECES;
const record = (completions: number) => ({ bestAccuracy: 1, bestStars: 3 as const, completions });
const FIRST = LESSON_CATALOG[0].id;
const SECOND = LESSON_CATALOG[1].id;

describe('adding and removing', () => {
  it('puts a new entry on top and does not duplicate one', () => {
    const one = addEntry([], libraryEntry(a, 1));
    expect(one.alreadyThere).toBe(false);
    const two = addEntry(one.entries, fileEntry('file-x', 'fur_elise.mid', 2));
    expect(two.entries.map((item) => item.id)).toEqual(['file-x', a.id]);
    const again = addEntry(two.entries, libraryEntry(a, 3));
    expect(again.alreadyThere).toBe(true);
    expect(again.entries).toHaveLength(2);
  });

  it('names a file entry after the file without its extension', () => {
    expect(fileEntry('file-x', 'fur_elise.final.mid', 0)).toMatchObject({
      title: 'fur_elise.final',
      fileName: 'fur_elise.final.mid',
      source: 'file',
    });
  });

  it('removes by id', () => {
    const list = [libraryEntry(a, 1), libraryEntry(b, 2)];
    expect(removeEntry(list, a.id).map((item) => item.id)).toEqual([b.id]);
    expect(removeEntry(list, 'nothing')).toHaveLength(2);
  });
});

describe('played time and lesson count', () => {
  it('marks only the entry that exists', () => {
    const list = [libraryEntry(a, 1)];
    expect(markPlayed(list, a.id, 50)[0].lastPlayedAt).toBe(50);
    expect(markPlayed(list, 'nothing', 50)).toEqual(list);
  });

  it('stores the lesson count and lists the entries that lack one', () => {
    const list = [libraryEntry(a, 1), libraryEntry(b, 2)];
    const counted = setLessonCount(list, a.id, 7);
    expect(counted[0].lessonCount).toBe(7);
    expect(entriesWithoutCount(counted).map((item) => item.id)).toEqual([b.id]);
  });
});

describe('order and filter', () => {
  it('lists played pieces by last played, then the others newest added first', () => {
    const list: MyLessonEntry[] = [
      { ...libraryEntry(a, 10), lastPlayedAt: 100 },
      libraryEntry(b, 30),
      { ...libraryEntry(c, 20), lastPlayedAt: 200 },
      fileEntry('file-x', 'x.mid', 40),
    ];
    expect(orderedEntries(list).map((item) => item.id)).toEqual([c.id, a.id, 'file-x', b.id]);
  });

  it('does not change the input', () => {
    const list = [libraryEntry(a, 1), libraryEntry(b, 2)];
    orderedEntries(list);
    expect(list.map((item) => item.id)).toEqual([a.id, b.id]);
  });

  it('filters by source', () => {
    const list = [libraryEntry(a, 1), fileEntry('file-x', 'x.mid', 2)];
    expect(filterBySource(list, 'all')).toHaveLength(2);
    expect(filterBySource(list, 'file').map((item) => item.id)).toEqual(['file-x']);
    expect(filterBySource(list, 'library').map((item) => item.id)).toEqual([a.id]);
  });
});

describe('entryProgress', () => {
  const records = {
    [lessonId(a.id, 'right', 'notes')]: record(1),
    [lessonId(a.id, 'left', 'notes')]: record(0),
    [lessonId(a.id, 'right', 'part', '1')]: record(3),
    [lessonId(b.id, 'right', 'notes')]: record(1),
    [FIRST]: record(1),
  };

  it('counts the finished lessons of this piece only', () => {
    expect(entryProgress({ id: a.id }, records).finished).toBe(2);
    expect(entryProgress({ id: b.id }, records).finished).toBe(1);
    expect(entryProgress({ id: c.id }, records).finished).toBe(0);
  });

  it('gives a percentage only when the course size is known', () => {
    expect(entryProgress({ id: a.id }, records).percent).toBeNull();
    expect(entryProgress({ id: a.id, lessonCount: 8 }, records).percent).toBe(25);
    expect(entryProgress({ id: c.id, lessonCount: 8 }, records).percent).toBe(0);
  });

  it('never goes above 100', () => {
    expect(entryProgress({ id: a.id, lessonCount: 1 }, records).percent).toBe(100);
  });
});

describe('migrateFromProgress', () => {
  it('adds the library pieces with a finished course lesson, the most finished first', () => {
    const records = {
      [lessonId(a.id, 'right', 'notes')]: record(1),
      [lessonId(b.id, 'right', 'notes')]: record(1),
      [lessonId(b.id, 'left', 'notes')]: record(1),
      [lessonId(c.id, 'right', 'notes')]: record(0),
      'file-abc': record(1),
    };
    const list = migrateFromProgress(records, LIBRARY_PIECES, 1000);
    expect(list.map((item) => item.id)).toEqual([b.id, a.id]);
    expect(list.every((item) => item.source === 'library')).toBe(true);
    expect(orderedEntries(list).map((item) => item.id)).toEqual([b.id, a.id]);
  });

  it('adds nothing for fresh progress', () => {
    expect(migrateFromProgress({}, LIBRARY_PIECES, 1)).toEqual([]);
  });
});

describe('continueTarget', () => {
  const entries = [libraryEntry(a, 1), fileEntry('file-x', 'x.mid', 2)];
  const pieces = LIBRARY_PIECES;

  it('is the next built-in lesson on a fresh start', () => {
    expect(continueTarget(undefined, entries, LESSON_CATALOG, {}, pieces)).toEqual({
      kind: 'builtin',
      lessonId: FIRST,
    });
  });

  it('is the next built-in lesson after a built-in lesson', () => {
    const records = { [FIRST]: record(1) };
    expect(continueTarget(FIRST, entries, LESSON_CATALOG, records, pieces)).toEqual({
      kind: 'builtin',
      lessonId: SECOND,
    });
  });

  it('is the last built-in lesson again when every one has a run', () => {
    const records = Object.fromEntries(LESSON_CATALOG.map((item) => [item.id, record(1)]));
    const last = LESSON_CATALOG[LESSON_CATALOG.length - 1].id;
    expect(continueTarget(FIRST, entries, LESSON_CATALOG, records, pieces)).toEqual({
      kind: 'builtin',
      lessonId: FIRST,
    });
    expect(continueTarget(last, [], LESSON_CATALOG, records, pieces)).toEqual({
      kind: 'builtin',
      lessonId: last,
    });
  });

  it('is the piece after a lesson of a piece in the list', () => {
    const last = lessonId(a.id, 'right', 'part', '1');
    expect(continueTarget(last, entries, LESSON_CATALOG, {}, pieces)).toEqual({
      kind: 'piece',
      entry: entries[0],
      lastLessonId: last,
    });
    const file = lessonId('file-x', 'both', 'merge', '1-2');
    expect(continueTarget(file, entries, LESSON_CATALOG, {}, pieces)).toMatchObject({
      kind: 'piece',
      entry: { id: 'file-x' },
    });
  });

  it('falls back to the built-in lesson when the piece was removed', () => {
    const last = lessonId(a.id, 'right', 'part', '1');
    expect(continueTarget(last, [entries[1]], LESSON_CATALOG, {}, pieces)).toEqual({
      kind: 'builtin',
      lessonId: FIRST,
    });
  });

  it('falls back when a library piece is no longer in the catalogue, but not for a file', () => {
    const last = lessonId(a.id, 'right', 'part', '1');
    expect(continueTarget(last, entries, LESSON_CATALOG, {}, [])).toMatchObject({
      kind: 'builtin',
    });
    const file = lessonId('file-x', 'right', 'notes');
    expect(continueTarget(file, entries, LESSON_CATALOG, {}, [])).toMatchObject({ kind: 'piece' });
  });

  it('is null when nothing is left to fall back to', () => {
    const records = Object.fromEntries(LESSON_CATALOG.map((item) => [item.id, record(1)]));
    expect(continueTarget(undefined, [], LESSON_CATALOG, records, pieces)).toBeNull();
  });
});

describe('saving and reading', () => {
  it('round-trips the entries', () => {
    const list: MyLessonEntry[] = [
      { ...libraryEntry(a, 1), lastPlayedAt: 5, lessonCount: 4 },
      fileEntry('file-x', 'x.mid', 2),
    ];
    expect(parseMyLessons(serialiseMyLessons(list))).toEqual(list);
  });

  it('returns null when nothing is saved, so the migration can run once', () => {
    expect(parseMyLessons(null)).toBeNull();
    expect(parseMyLessons(serialiseMyLessons([]))).toEqual([]);
  });

  it('treats invalid data and other versions as an empty list', () => {
    for (const text of [
      '',
      'not json',
      'null',
      '[]',
      '{"version":2,"entries":[]}',
      '{"version":1}',
    ]) {
      expect(parseMyLessons(text), text).toEqual([]);
    }
  });

  it('drops bad entries and repeated ids and keeps the good ones', () => {
    const good = libraryEntry(a, 1);
    const text = JSON.stringify({
      version: 1,
      entries: [
        good,
        good,
        null,
        42,
        { id: '', source: 'library', addedAt: 1 },
        { id: 'x', source: 'cloud', addedAt: 1 },
        { id: 'y', source: 'library', addedAt: 'now' },
        { id: 'file-z', source: 'file', addedAt: 1 },
        { id: b.id, source: 'library', addedAt: 2, lessonCount: -3, lastPlayedAt: 'x' },
      ],
    });
    const parsed = parseMyLessons(text);
    expect(parsed?.map((item) => item.id)).toEqual([a.id, b.id]);
    expect(parsed?.[1].lessonCount).toBeUndefined();
    expect(parsed?.[1].lastPlayedAt).toBeUndefined();
  });
});
