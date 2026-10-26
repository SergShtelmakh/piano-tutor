const STORAGE_KEY = 'piano-tutor.installHint';

/** True once the learner chose "Not now". Unavailable storage counts as not dismissed. */
export function loadInstallHintDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dismissed';
  } catch {
    return false;
  }
}

/** Best effort: failures (blocked or full storage) are ignored. */
export function saveInstallHintDismissed(): void {
  try {
    localStorage.setItem(STORAGE_KEY, 'dismissed');
  } catch {
    // The caller keeps an in-memory flag, so the card stays hidden for this session.
  }
}
