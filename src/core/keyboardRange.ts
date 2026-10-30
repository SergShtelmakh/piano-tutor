// Pure: the range of keys on the learner's real keyboard. Persistence lives in
// `keyboard/storage.ts`, the calibration hook in `keyboard/useCalibration.ts`.
import { PIANO_HIGH, PIANO_LOW, type NoteRange } from './keyboardLayout.ts';

/** The learner's keyboard, or `null` while nothing is set (no warnings, no dimmed keys). */
export type KeyboardRange = NoteRange | null;

export const KEYBOARD_VERSION = 1;

const OCTAVE = 12;

/** Key counts the Keyboard panel offers. */
export const KEY_COUNTS = [25, 37, 49, 61, 76, 88] as const;
export type KeyCount = (typeof KEY_COUNTS)[number];

/** The usual lowest key of each size; the octave buttons cover keyboards that start elsewhere. */
const DEFAULT_RANGES: Record<KeyCount, NoteRange> = {
  25: { low: 48, high: 72 }, // C3–C5
  37: { low: 48, high: 84 }, // C3–C6
  49: { low: 36, high: 84 }, // C2–C6
  61: { low: 36, high: 96 }, // C2–C7
  76: { low: 28, high: 103 }, // E1–G7
  88: { low: 21, high: 108 }, // A0–C8
};

export function rangeForKeyCount(count: KeyCount): NoteRange {
  return { ...DEFAULT_RANGES[count] };
}

/** How many keys the range holds (a black key at either end counts too). */
export function keyCount({ low, high }: NoteRange): number {
  return high - low + 1;
}

/** The standard key count of a range, or `undefined` for a calibrated size such as 32 keys. */
export function standardKeyCount(range: NoteRange): KeyCount | undefined {
  return KEY_COUNTS.find((count) => count === keyCount(range));
}

/** True when the whole range, moved by `octaves` octaves, still lies inside A0–C8. */
export function canShift(range: NoteRange, octaves: number): boolean {
  const low = range.low + octaves * OCTAVE;
  const high = range.high + octaves * OCTAVE;
  return low >= PIANO_LOW && high <= PIANO_HIGH;
}

/** The range moved by whole octaves, or the same range when that would leave A0–C8. */
export function shiftRange(range: NoteRange, octaves: number): NoteRange {
  if (!canShift(range, octaves)) return range;
  return { low: range.low + octaves * OCTAVE, high: range.high + octaves * OCTAVE };
}

/** The range between two pressed keys, whichever was pressed first. */
export function rangeFromNotes(a: number, b: number): NoteRange {
  return { low: Math.min(a, b), high: Math.max(a, b) };
}

export function isOutside(note: number, range: KeyboardRange): boolean {
  return range !== null && (note < range.low || note > range.high);
}

/** Calibration: press the lowest key, then the highest. */
export type CalibrationState =
  { step: 'lowest' } | { step: 'highest'; first: number } | { step: 'done'; range: NoteRange };

export const CALIBRATION_START: CalibrationState = { step: 'lowest' };

/**
 * The state after a key press. A note outside A0–C8 is ignored (it is not on a piano), and so is
 * the same note as the first press: the second press has to be another key.
 */
export function calibrationPress(state: CalibrationState, note: number): CalibrationState {
  if (state.step === 'done' || note < PIANO_LOW || note > PIANO_HIGH) return state;
  if (state.step === 'lowest') return { step: 'highest', first: note };
  if (note === state.first) return state;
  return { step: 'done', range: rangeFromNotes(state.first, note) };
}

export interface OutsideNotes {
  /** Distinct pitches outside the range. */
  count: number;
  /** The lowest note below the range, if any. */
  lowest?: number;
  /** The highest note above the range, if any. */
  highest?: number;
}

/** Which notes of a lesson the keyboard doesn't have. With no range set, none. */
export function notesOutside(
  steps: readonly (readonly number[])[],
  range: KeyboardRange,
): OutsideNotes {
  if (range === null) return { count: 0 };
  const outside = new Set<number>();
  for (const step of steps) for (const note of step) if (isOutside(note, range)) outside.add(note);
  const below = [...outside].filter((note) => note < range.low);
  const above = [...outside].filter((note) => note > range.high);
  return {
    count: outside.size,
    ...(below.length > 0 ? { lowest: Math.min(...below) } : {}),
    ...(above.length > 0 ? { highest: Math.max(...above) } : {}),
  };
}

/** Reads a saved range. Anything that is not valid versioned JSON means "not set". */
export function parseKeyboardRange(text: string | null): KeyboardRange {
  if (!text) return null;
  try {
    const data: unknown = JSON.parse(text);
    if (typeof data !== 'object' || data === null) return null;
    const { version, low, high } = data as Record<string, unknown>;
    if (version !== KEYBOARD_VERSION) return null;
    if (typeof low !== 'number' || typeof high !== 'number') return null;
    if (!Number.isInteger(low) || !Number.isInteger(high)) return null;
    if (low < PIANO_LOW || high > PIANO_HIGH || low >= high) return null;
    return { low, high };
  } catch {
    return null;
  }
}

export function serialiseKeyboardRange(range: NoteRange): string {
  return JSON.stringify({ version: KEYBOARD_VERSION, low: range.low, high: range.high });
}
