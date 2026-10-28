import {
  EMPTY_MARKS,
  parseMarks,
  serialiseMarks,
  type LibraryMarks,
} from '../core/libraryMarks.ts';

const STORAGE_KEY = 'piano-tutor.library';

/** The saved marks, or none if nothing valid is saved or storage is unavailable. */
export function loadMarks(): LibraryMarks {
  try {
    return parseMarks(localStorage.getItem(STORAGE_KEY));
  } catch {
    return EMPTY_MARKS;
  }
}

/** Best effort: failures (blocked or full storage) are ignored; the marks stay for this session. */
export function saveMarks(marks: LibraryMarks): void {
  try {
    localStorage.setItem(STORAGE_KEY, serialiseMarks(marks));
  } catch {
    // The marks still work until the tab is closed.
  }
}
