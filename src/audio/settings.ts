const VOLUME_KEY = 'piano-tutor.volume';
const MUTED_KEY = 'piano-tutor.muted';

export const DEFAULT_VOLUME = 80;

/** Saved volume in percent (0–100), or the default if nothing valid is saved or storage is unavailable. */
export function loadVolume(): number {
  try {
    const raw = localStorage.getItem(VOLUME_KEY);
    if (raw === null) return DEFAULT_VOLUME;
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 && value <= 100 ? value : DEFAULT_VOLUME;
  } catch {
    return DEFAULT_VOLUME;
  }
}

/** Best effort: failures (blocked or full storage) are ignored. */
export function saveVolume(volume: number): void {
  try {
    localStorage.setItem(VOLUME_KEY, String(volume));
  } catch {
    // The volume still applies for this session.
  }
}

export function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTED_KEY) === '1';
  } catch {
    return false;
  }
}

/** Best effort: failures (blocked or full storage) are ignored. */
export function saveMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTED_KEY, muted ? '1' : '0');
  } catch {
    // The mute state still applies for this session.
  }
}
