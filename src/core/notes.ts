const BLACK_PITCH_CLASSES = new Set([1, 3, 6, 8, 10]);

/** Keys shown on the on-screen piano: the B below the base C, two octaves, and the top C. */
export const KEY_COUNT = 26;
export const MIN_BASE_OCTAVE = 1;
export const MAX_BASE_OCTAVE = 6;
export const DEFAULT_BASE_OCTAVE = 3;

/** 0 = C, 1 = C♯, … 11 = B. Names live in `i18n/noteNames.ts`, since they depend on the language. */
export function pitchClass(note: number): number {
  return note % 12;
}

export function isBlackKey(note: number): boolean {
  return BLACK_PITCH_CLASSES.has(pitchClass(note));
}

/** Scientific octave number: C4 is middle C (note 60). */
export function octaveOf(note: number): number {
  return Math.floor(note / 12) - 1;
}

/** Note number of the C that starts the given octave. */
export function octaveStart(octave: number): number {
  return (octave + 1) * 12;
}

/** The shown notes for a base octave: the B below the base C up to the C two octaves higher. */
export function keyboardRange(baseOctave: number): number[] {
  const first = octaveStart(baseOctave) - 1;
  return Array.from({ length: KEY_COUNT }, (_, i) => first + i);
}

export function clampBaseOctave(octave: number): number {
  return Math.min(MAX_BASE_OCTAVE, Math.max(MIN_BASE_OCTAVE, octave));
}
