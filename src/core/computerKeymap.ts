import { clampBaseOctave, octaveStart } from './notes.ts';

/** Semitones above the base C for each physical key (`KeyboardEvent.code`), DAW-style one row. */
export const KEY_OFFSETS: Readonly<Record<string, number>> = {
  KeyA: 0,
  KeyW: 1,
  KeyS: 2,
  KeyE: 3,
  KeyD: 4,
  KeyF: 5,
  KeyT: 6,
  KeyG: 7,
  KeyY: 8,
  KeyH: 9,
  KeyU: 10,
  KeyJ: 11,
  KeyK: 12,
  KeyO: 13,
  KeyL: 14,
  KeyP: 15,
  Semicolon: 16,
};

export const OCTAVE_DOWN_CODE = 'KeyZ';
export const OCTAVE_UP_CODE = 'KeyX';

/** Labels used when the Keyboard Map API is unavailable. */
export const QWERTY_LABELS: Readonly<Record<string, string>> = Object.fromEntries(
  Object.keys(KEY_OFFSETS).map((code) => [code, code === 'Semicolon' ? ';' : code.slice(3)]),
);

/** Note number played by a physical key at the given base octave, or null if the key is unmapped. */
export function noteForCode(code: string, baseOctave: number): number | null {
  const offset = KEY_OFFSETS[code];
  return offset === undefined ? null : octaveStart(baseOctave) + offset;
}

/** Computer key (code) that plays the given note at the base octave, or null if none does. */
export function codeForNote(note: number, baseOctave: number): string | null {
  const offset = note - octaveStart(baseOctave);
  for (const [code, value] of Object.entries(KEY_OFFSETS)) {
    if (value === offset) return code;
  }
  return null;
}

export function shiftOctave(baseOctave: number, delta: number): number {
  return clampBaseOctave(baseOctave + delta);
}
