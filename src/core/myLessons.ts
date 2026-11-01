// Pure: the learner's list of pieces they are learning ("My lessons"), the progress shown for
// each, and what the Continue card opens. Persistence lives in `src/myLessons/`; times are passed in.
import { isFinished, pieceIdOfLesson, piecesInProgress } from './course.ts';
import { nextLessonId, type LessonEntry } from './lessons.ts';
import type { LibraryPiece } from './libraryCatalog.ts';
import type { LessonRecord } from './progress.ts';

export const MY_LESSONS_VERSION = 1;

export type LessonSource = 'library' | 'file';
export type SourceFilter = 'all' | LessonSource;

export interface MyLessonEntry {
  /** The library piece id, or `file-<hash>` for a file kept on the device. */
  id: string;
  source: LessonSource;
  /** A file's name without its extension; empty for a library piece (its title is in the catalogue). */
  title: string;
  /** A file's name as chosen; empty for a library piece. */
  fileName: string;
  /** When it was added, in ms. */
  addedAt: number;
  /** When a lesson of it was last opened, in ms. */
  lastPlayedAt?: number;
  /** The number of lessons in its course, known once the course has been built. */
  lessonCount?: number;
}

export function libraryEntry(piece: Pick<LibraryPiece, 'id'>, now: number): MyLessonEntry {
  return { id: piece.id, source: 'library', title: '', fileName: '', addedAt: now };
}

export function fileEntry(id: string, fileName: string, now: number): MyLessonEntry {
  return { id, source: 'file', title: fileName.replace(/\.[^.]*$/, ''), fileName, addedAt: now };
}

/** Adds an entry. One that is already there is kept (not duplicated) and reported. */
export function addEntry(
  entries: readonly MyLessonEntry[],
  entry: MyLessonEntry,
): { entries: MyLessonEntry[]; alreadyThere: boolean } {
  if (entries.some((item) => item.id === entry.id)) {
    return { entries: [...entries], alreadyThere: true };
  }
  return { entries: [entry, ...entries], alreadyThere: false };
}

export function removeEntry(entries: readonly MyLessonEntry[], id: string): MyLessonEntry[] {
  return entries.filter((item) => item.id !== id);
}

function updated(
  entries: readonly MyLessonEntry[],
  id: string,
  change: (entry: MyLessonEntry) => MyLessonEntry,
): MyLessonEntry[] {
  return entries.map((item) => (item.id === id ? change(item) : item));
}

export function markPlayed(
  entries: readonly MyLessonEntry[],
  id: string,
  at: number,
): MyLessonEntry[] {
  return updated(entries, id, (item) => ({ ...item, lastPlayedAt: at }));
}

export function setLessonCount(
  entries: readonly MyLessonEntry[],
  id: string,
  lessonCount: number,
): MyLessonEntry[] {
  return updated(entries, id, (item) =>
    item.lessonCount === lessonCount ? item : { ...item, lessonCount },
  );
}

/** Played pieces first (the latest played first), then the ones never played, the newest added first. */
export function orderedEntries(entries: readonly MyLessonEntry[]): MyLessonEntry[] {
  return [...entries].sort((a, b) => {
    if (a.lastPlayedAt !== undefined && b.lastPlayedAt !== undefined) {
      return b.lastPlayedAt - a.lastPlayedAt || b.addedAt - a.addedAt;
    }
    if (a.lastPlayedAt !== undefined) return -1;
    if (b.lastPlayedAt !== undefined) return 1;
    return b.addedAt - a.addedAt;
  });
}

export function filterBySource(
  entries: readonly MyLessonEntry[],
  filter: SourceFilter,
): MyLessonEntry[] {
  return filter === 'all' ? [...entries] : entries.filter((item) => item.source === filter);
}

export interface EntryProgress {
  /** Course lessons of this piece with a finished run. */
  finished: number;
  /** 0 to 100 when the course size is known, else null. */
  percent: number | null;
}

export function entryProgress(
  entry: Pick<MyLessonEntry, 'id' | 'lessonCount'>,
  records: Readonly<Record<string, LessonRecord>>,
): EntryProgress {
  const finished = Object.keys(records).filter(
    (id) => pieceIdOfLesson(id) === entry.id && isFinished(records, id),
  ).length;
  const count = entry.lessonCount;
  const percent =
    count !== undefined && count > 0 ? Math.min(100, Math.round((finished / count) * 100)) : null;
  return { finished, percent };
}

/** The entries whose course size is still unknown. */
export function entriesWithoutCount(entries: readonly MyLessonEntry[]): MyLessonEntry[] {
  return entries.filter((item) => item.lessonCount === undefined);
}

/**
 * The list for a first start: the library pieces with at least one finished course lesson, so
 * nothing the learner was working on disappears.
 */
export function migrateFromProgress(
  records: Readonly<Record<string, LessonRecord>>,
  pieces: readonly LibraryPiece[],
  now: number,
): MyLessonEntry[] {
  return piecesInProgress(records, pieces).map(({ piece }, index) =>
    libraryEntry(piece, now - index),
  );
}

export type ContinueTarget =
  | { kind: 'builtin'; lessonId: string }
  | { kind: 'piece'; entry: MyLessonEntry; lastLessonId: string };

/**
 * What the Continue card opens. After a built-in lesson: the next built-in lesson without a
 * finished run, or that lesson again when all have one. After a course lesson of a piece that is
 * still in the list (and in the library, for a library piece): that piece. Otherwise the next
 * built-in lesson, or null when none is left.
 */
export function continueTarget(
  lastLessonId: string | undefined,
  entries: readonly MyLessonEntry[],
  catalog: readonly LessonEntry[],
  records: Readonly<Record<string, LessonRecord>>,
  pieces: readonly Pick<LibraryPiece, 'id'>[],
): ContinueTarget | null {
  const fallback = nextLessonId(catalog, records);
  if (lastLessonId !== undefined) {
    if (catalog.some((item) => item.id === lastLessonId)) {
      return { kind: 'builtin', lessonId: fallback ?? lastLessonId };
    }
    const pieceId = pieceIdOfLesson(lastLessonId);
    const entry = entries.find((item) => item.id === pieceId);
    if (entry && (entry.source === 'file' || pieces.some((piece) => piece.id === entry.id))) {
      return { kind: 'piece', entry, lastLessonId };
    }
  }
  return fallback === null ? null : { kind: 'builtin', lessonId: fallback };
}

function parseEntry(value: unknown): MyLessonEntry | null {
  if (typeof value !== 'object' || value === null) return null;
  const { id, source, title, fileName, addedAt, lastPlayedAt, lessonCount } = value as Record<
    string,
    unknown
  >;
  if (typeof id !== 'string' || id === '') return null;
  if (source !== 'library' && source !== 'file') return null;
  if (typeof addedAt !== 'number' || !Number.isFinite(addedAt)) return null;
  if (source === 'file' && (typeof title !== 'string' || typeof fileName !== 'string')) return null;
  const entry: MyLessonEntry = {
    id,
    source,
    title: typeof title === 'string' ? title : '',
    fileName: typeof fileName === 'string' ? fileName : '',
    addedAt,
  };
  if (typeof lastPlayedAt === 'number' && Number.isFinite(lastPlayedAt)) {
    entry.lastPlayedAt = lastPlayedAt;
  }
  if (typeof lessonCount === 'number' && Number.isInteger(lessonCount) && lessonCount > 0) {
    entry.lessonCount = lessonCount;
  }
  return entry;
}

/**
 * Reads the saved list. Returns null when nothing is saved (the first start, which runs the
 * migration); invalid data or a wrong version is an empty list. Bad entries and repeated ids
 * are dropped.
 */
export function parseMyLessons(text: string | null): MyLessonEntry[] | null {
  if (text === null) return null;
  try {
    const data: unknown = JSON.parse(text);
    if (typeof data !== 'object' || data === null) return [];
    const { version, entries } = data as Record<string, unknown>;
    if (version !== MY_LESSONS_VERSION || !Array.isArray(entries)) return [];
    const seen = new Set<string>();
    const result: MyLessonEntry[] = [];
    for (const value of entries) {
      const entry = parseEntry(value);
      if (entry && !seen.has(entry.id)) {
        seen.add(entry.id);
        result.push(entry);
      }
    }
    return result;
  } catch {
    return [];
  }
}

export function serialiseMyLessons(entries: readonly MyLessonEntry[]): string {
  return JSON.stringify({ version: MY_LESSONS_VERSION, entries });
}
