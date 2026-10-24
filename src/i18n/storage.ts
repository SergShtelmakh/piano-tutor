import { isLocale, type Locale } from './core.ts';

const STORAGE_KEY = 'piano-tutor.locale';

/** Returns the saved locale, or null if nothing valid is saved or storage is unavailable. */
export function loadLocale(): Locale | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isLocale(value) ? value : null;
  } catch {
    return null;
  }
}

/** Best effort: failures (blocked or full storage) are ignored. */
export function saveLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // The choice still applies for this session.
  }
}
