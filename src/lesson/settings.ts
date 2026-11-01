import {
  DEFAULT_LESSON_SETTINGS,
  parseLessonSettings,
  serialiseLessonSettings,
  type LessonSettings,
} from '../core/practice.ts';

const STORAGE_KEY = 'piano-tutor.lessonSettings';

/** The saved settings, or the defaults when nothing valid is saved or storage is unavailable. */
export function loadLessonSettings(): LessonSettings {
  try {
    return parseLessonSettings(localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_LESSON_SETTINGS;
  }
}

/** Best effort: failures (blocked or full storage) are ignored; the settings last for the session. */
export function saveLessonSettings(settings: LessonSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, serialiseLessonSettings(settings));
  } catch {
    // The settings still apply until the tab is closed.
  }
}
