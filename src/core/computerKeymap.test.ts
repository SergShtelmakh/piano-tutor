import { describe, expect, it } from 'vitest';
import {
  codeForNote,
  KEY_OFFSETS,
  noteForCode,
  QWERTY_LABELS,
  shiftOctave,
} from './computerKeymap.ts';
import { noteLabelFor } from '../i18n/noteNames.ts';

describe('computer keymap', () => {
  it('maps the white keys to C3–E4 at base octave 3', () => {
    const white = [
      'KeyA',
      'KeyS',
      'KeyD',
      'KeyF',
      'KeyG',
      'KeyH',
      'KeyJ',
      'KeyK',
      'KeyL',
      'Semicolon',
    ];
    const expected = ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4'];
    expect(white.map((c) => noteLabelFor('en', noteForCode(c, 3)!))).toEqual(expected);
  });

  it('maps the black keys', () => {
    const black = ['KeyW', 'KeyE', 'KeyT', 'KeyY', 'KeyU', 'KeyO', 'KeyP'];
    const expected = ['C♯3', 'D♯3', 'F♯3', 'G♯3', 'A♯3', 'C♯4', 'D♯4'];
    expect(black.map((c) => noteLabelFor('en', noteForCode(c, 3)!))).toEqual(expected);
  });

  it('moves with the base octave', () => {
    expect(noteForCode('KeyA', 4)).toBe(60);
    expect(noteForCode('KeyA', 1)).toBe(24);
  });

  it('returns null for unmapped codes', () => {
    expect(noteForCode('KeyQ', 3)).toBeNull();
    expect(noteForCode('Digit1', 3)).toBeNull();
    expect(noteForCode('KeyZ', 3)).toBeNull();
  });

  it('finds the key for a note and back', () => {
    expect(codeForNote(48, 3)).toBe('KeyA');
    expect(codeForNote(64, 3)).toBe('Semicolon');
    expect(codeForNote(65, 3)).toBeNull();
    expect(codeForNote(47, 3)).toBeNull();
  });

  it('clamps octave shifts to C1–C6', () => {
    expect(shiftOctave(3, -1)).toBe(2);
    expect(shiftOctave(1, -1)).toBe(1);
    expect(shiftOctave(6, 1)).toBe(6);
    expect(shiftOctave(5, 1)).toBe(6);
  });

  it('has a fallback label for every mapped key', () => {
    for (const code of Object.keys(KEY_OFFSETS)) expect(QWERTY_LABELS[code]).toMatch(/^[A-Z;]$/);
  });
});
