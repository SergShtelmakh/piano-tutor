import { parseMyLessons, serialiseMyLessons, type MyLessonEntry } from '../core/myLessons.ts';

const STORAGE_KEY = 'piano-tutor.myLessons';

/** The saved list; null when nothing is saved (or storage is blocked), which runs the migration. */
export function loadMyLessons(): MyLessonEntry[] | null {
  try {
    return parseMyLessons(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

/** Best effort: a failure (blocked or full storage) is ignored; the list stays for this session. */
export function saveMyLessons(entries: readonly MyLessonEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, serialiseMyLessons(entries));
  } catch {
    // The list still works until the tab is closed.
  }
}
