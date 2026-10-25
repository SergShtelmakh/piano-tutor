import { EMPTY_PROGRESS, parseProgress, type Progress } from '../core/progress.ts';

const STORAGE_KEY = 'piano-tutor.progress';

/** Loads saved progress. `available` is false when storage cannot be read or written. */
export function loadProgress(): { progress: Progress; available: boolean } {
  try {
    const progress = parseProgress(localStorage.getItem(STORAGE_KEY));
    // A write probe, because some browsers allow reads but throw on writes.
    localStorage.setItem(`${STORAGE_KEY}.probe`, '1');
    localStorage.removeItem(`${STORAGE_KEY}.probe`);
    return { progress, available: true };
  } catch {
    return { progress: EMPTY_PROGRESS, available: false };
  }
}

/** Returns false when the progress could not be saved. */
export function saveProgress(progress: Progress): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing was saved, or storage is blocked.
  }
}
