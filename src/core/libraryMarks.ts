// Pure: the learner's own marks on library pieces. Persistence lives in `library/storage.ts`.

export const MARKS_VERSION = 1;

export interface LibraryMarks {
  /** Piece ids the learner starred. */
  favourites: readonly string[];
  /** Piece ids the learner marked as done. */
  done: readonly string[];
}

export const EMPTY_MARKS: LibraryMarks = { favourites: [], done: [] };

function toggled(list: readonly string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

export function toggleFavourite(marks: LibraryMarks, id: string): LibraryMarks {
  return { ...marks, favourites: toggled(marks.favourites, id) };
}

export function toggleDone(marks: LibraryMarks, id: string): LibraryMarks {
  return { ...marks, done: toggled(marks.done, id) };
}

function idList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === 'string'))];
}

/**
 * Reads saved marks. Anything that is not valid versioned JSON means no marks. Ids of pieces
 * that no longer exist are kept, so a removed piece cannot wipe the rest.
 */
export function parseMarks(text: string | null): LibraryMarks {
  if (!text) return EMPTY_MARKS;
  try {
    const data: unknown = JSON.parse(text);
    if (typeof data !== 'object' || data === null) return EMPTY_MARKS;
    const record = data as Record<string, unknown>;
    if (record.version !== MARKS_VERSION) return EMPTY_MARKS;
    return { favourites: idList(record.favourites), done: idList(record.done) };
  } catch {
    return EMPTY_MARKS;
  }
}

export function serialiseMarks(marks: LibraryMarks): string {
  return JSON.stringify({
    version: MARKS_VERSION,
    favourites: marks.favourites,
    done: marks.done,
  });
}
