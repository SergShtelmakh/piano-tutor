import {
  parseKeyboardRange,
  serialiseKeyboardRange,
  type KeyboardRange,
} from '../core/keyboardRange.ts';

const STORAGE_KEY = 'piano-tutor.keyboard';

/** The saved range, or "not set" if nothing valid is saved or storage is unavailable. */
export function loadKeyboardRange(): KeyboardRange {
  try {
    return parseKeyboardRange(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

/** Best effort: failures (blocked or full storage) are ignored; the range stays for this session. */
export function saveKeyboardRange(range: KeyboardRange): void {
  try {
    if (range === null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, serialiseKeyboardRange(range));
  } catch {
    // The range still works until the tab is closed.
  }
}
