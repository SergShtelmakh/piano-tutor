// Pure: where a note sits on the grand staff. Drawing lives in `components/StaffView.tsx`.
import { isBlackKey, octaveOf, pitchClass } from './notes.ts';

export type Clef = 'treble' | 'bass';

export interface StaffPosition {
  clef: Clef;
  /**
   * White-key steps from middle C: C4 = 0, D4 = 1, B3 = -1, C5 = 7. Even numbers are lines or
   * ledger lines, odd numbers are spaces. The treble staff lines are 2, 4, 6, 8, 10 (E4 … F5);
   * the bass staff lines are -10, -8, -6, -4, -2 (G2 … A3).
   */
  index: number;
  /** Indices of the ledger lines between the staff and the note, in ascending order. */
  ledger: readonly number[];
}

/** C4 (note 60) and above are drawn on the treble staff, lower notes on the bass staff. */
const FIRST_TREBLE_NOTE = 60;

const TREBLE_LINES = { bottom: 2, top: 10 };
const BASS_LINES = { bottom: -10, top: -2 };

/** Index of each white pitch class: C D E F G A B -> 0..6. */
const WHITE_STEP: Record<number, number> = { 0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6 };

function ceilEven(n: number): number {
  return n % 2 === 0 ? n : n + 1;
}

function floorEven(n: number): number {
  return n % 2 === 0 ? n : n - 1;
}

function evenRange(from: number, to: number): number[] {
  const result: number[] = [];
  for (let i = ceilEven(from); i <= to; i += 2) result.push(i);
  return result;
}

/** Ledger lines needed by a note at `index` for a staff with the given edge lines. */
function ledgerLines(index: number, staff: { bottom: number; top: number }): number[] {
  if (index < staff.bottom) {
    // Ledger lines start two steps below the bottom line.
    return evenRange(index, staff.bottom - 2);
  }
  if (index > staff.top) {
    return evenRange(staff.top + 2, floorEven(index));
  }
  return [];
}

/** The staff position of a white-key note, or `null` for a black key (no accidentals yet). */
export function staffPosition(note: number): StaffPosition | null {
  if (isBlackKey(note)) return null;

  const index = (octaveOf(note) - 4) * 7 + WHITE_STEP[pitchClass(note)];
  const clef: Clef = note >= FIRST_TREBLE_NOTE ? 'treble' : 'bass';
  return { clef, index, ledger: ledgerLines(index, clef === 'treble' ? TREBLE_LINES : BASS_LINES) };
}

export interface SpelledNote {
  position: StaffPosition;
  /** True for a black key: it is drawn as the white key below it, with a sharp. */
  sharp: boolean;
}

/** Where a note sits on the staff, black keys included (spelled with sharps only, no flats). */
export function spellNote(note: number): SpelledNote {
  const sharp = isBlackKey(note);
  // The key below a black key is always a white key, so `staffPosition` can't be null here.
  const position = staffPosition(sharp ? note - 1 : note)!;
  return { position, sharp };
}
