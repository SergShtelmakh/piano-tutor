// Pure: note names per language. Octave numbers are scientific everywhere (C4 / до4 = middle C).
import { octaveOf, pitchClass } from '../core/notes.ts';
import type { Locale } from './core.ts';

const LETTERS = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'] as const;

export const NOTE_NAMES: Record<Locale, readonly string[]> = {
  en: LETTERS,
  // German uses H for B natural; A♯ is what English calls B♭ (German B).
  de: [...LETTERS.slice(0, 11), 'H'],
  uk: ['до', 'до♯', 'ре', 'ре♯', 'мі', 'фа', 'фа♯', 'соль', 'соль♯', 'ля', 'ля♯', 'сі'],
  fr: ['do', 'do♯', 'ré', 'ré♯', 'mi', 'fa', 'fa♯', 'sol', 'sol♯', 'la', 'la♯', 'si'],
};

/** Name without octave, e.g. `C`, `до♯`. */
export function noteNameFor(locale: Locale, note: number): string {
  return NOTE_NAMES[locale][pitchClass(note)];
}

/** Name with octave number, e.g. `C4`, `до4`. */
export function noteLabelFor(locale: Locale, note: number): string {
  return `${noteNameFor(locale, note)}${octaveOf(note)}`;
}
