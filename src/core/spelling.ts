// Pure: how a note is written. A MIDI note number says nothing about D♭ or C♯; the key signature
// of a piece (or the spelling in a MusicXML file) decides. Drawing lives in `components/`.
import type { Clef } from './staff.ts';

/** C D E F G A B → 0–6. */
const STEP_SEMITONES = [0, 2, 4, 5, 7, 9, 11] as const;
const SEMITONE_STEP: Record<number, number> = { 0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6 };

/** The order in which sharps and flats are added to a key signature, as steps (C = 0 … B = 6). */
const SHARP_STEPS = [3, 0, 4, 1, 5, 2, 6]; // F C G D A E B
const FLAT_STEPS = [6, 2, 5, 1, 4, 0, 3]; // B E A D G C F

/** Staff index of each sign of a key signature on the treble staff (F5 C5 G5 D5 A4 E5 B4, …). */
const TREBLE_SHARP_INDEXES = [10, 7, 11, 8, 5, 9, 6];
const TREBLE_FLAT_INDEXES = [6, 9, 5, 8, 4, 7, 3];
/** The bass staff shows the same signs two octaves lower. */
const BASS_SHIFT = 14;

export interface Spelled {
  /** C D E F G A B → 0–6. */
  step: number;
  /** Scientific octave of the written note (C4 = middle C; B♯3 is written in octave 3). */
  octave: number;
  alter: -1 | 0 | 1;
}

/** White-key steps from middle C, as in `StaffPosition.index`: C4 = 0, B3 = −1, C5 = 7. */
export function staffIndex(step: number, octave: number): number {
  return (octave - 4) * 7 + step;
}

/**
 * The alteration (−1, 0, +1) that turns the natural `step` into the pitch class of `note`, or
 * `undefined` when that needs a double sharp or flat (or the note is not near that step).
 */
export function alterFor(note: number, step: number): -1 | 0 | 1 | undefined {
  const distance = (((note - STEP_SEMITONES[step]) % 12) + 12) % 12;
  if (distance === 0) return 0;
  if (distance === 1) return 1;
  if (distance === 11) return -1;
  return undefined;
}

/** A written spelling for a MIDI note when the step is given (MusicXML), or `undefined`. */
export function spellingFor(
  note: number,
  step: number,
): { step: number; alter: -1 | 0 | 1 } | undefined {
  if (!Number.isInteger(step) || step < 0 || step > 6) return undefined;
  const alter = alterFor(note, step);
  return alter === undefined ? undefined : { step, alter };
}

function octaveOf(note: number, step: number, alter: number): number {
  return (note - alter - STEP_SEMITONES[step]) / 12 - 1;
}

/**
 * How to write a MIDI note. A given spelling (from a MusicXML file) is kept when it really is that
 * pitch; otherwise a black key gets a flat in a key with flats and a sharp in any other key.
 */
export function spell(
  note: number,
  fifths: number,
  given?: { step: number; alter: -1 | 0 | 1 },
): Spelled {
  if (given && alterFor(note, given.step) === given.alter) {
    return {
      step: given.step,
      octave: octaveOf(note, given.step, given.alter),
      alter: given.alter,
    };
  }
  const pitchClass = ((note % 12) + 12) % 12;
  const natural = SEMITONE_STEP[pitchClass];
  if (natural !== undefined) {
    return { step: natural, octave: octaveOf(note, natural, 0), alter: 0 };
  }
  if (fifths < 0) {
    const step = SEMITONE_STEP[pitchClass + 1];
    return { step, octave: octaveOf(note, step, -1), alter: -1 };
  }
  const step = SEMITONE_STEP[pitchClass - 1];
  return { step, octave: octaveOf(note, step, 1), alter: 1 };
}

/** The alteration of each step (C D E F G A B) that a key signature gives. */
export function keyAlterations(fifths: number): (-1 | 0 | 1)[] {
  const alterations: (-1 | 0 | 1)[] = [0, 0, 0, 0, 0, 0, 0];
  const count = Math.min(7, Math.abs(fifths));
  const steps = fifths > 0 ? SHARP_STEPS : FLAT_STEPS;
  for (let i = 0; i < count; i++) alterations[steps[i]] = fifths > 0 ? 1 : -1;
  return alterations;
}

/** The staff indexes of the signs of a key signature, in the order they are written. */
export function keySignatureIndexes(fifths: number, clef: Clef): number[] {
  const count = Math.min(7, Math.abs(fifths));
  const all = fifths > 0 ? TREBLE_SHARP_INDEXES : TREBLE_FLAT_INDEXES;
  const shift = clef === 'bass' ? BASS_SHIFT : 0;
  return all.slice(0, count).map((index) => index - shift);
}
