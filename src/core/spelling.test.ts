import { describe, expect, it } from 'vitest';
import {
  alterFor,
  keyAlterations,
  keySignatureIndexes,
  spell,
  spellingFor,
  staffIndex,
} from './spelling.ts';

describe('staffIndex', () => {
  it('counts white-key steps from middle C', () => {
    expect(staffIndex(0, 4)).toBe(0); // C4
    expect(staffIndex(6, 3)).toBe(-1); // B3
    expect(staffIndex(0, 5)).toBe(7); // C5
    expect(staffIndex(3, 5)).toBe(10); // F5, the top treble line
  });
});

describe('spell without a given spelling', () => {
  it('writes white keys as they are', () => {
    expect(spell(60, 0)).toEqual({ step: 0, octave: 4, alter: 0 }); // C4
    expect(spell(71, 3)).toEqual({ step: 6, octave: 4, alter: 0 }); // B4
  });

  it('writes black keys with sharps in C and in sharp keys', () => {
    expect(spell(61, 0)).toEqual({ step: 0, octave: 4, alter: 1 }); // C♯4
    expect(spell(70, 2)).toEqual({ step: 5, octave: 4, alter: 1 }); // A♯4
  });

  it('writes black keys with flats in flat keys', () => {
    expect(spell(61, -5)).toEqual({ step: 1, octave: 4, alter: -1 }); // D♭4
    expect(spell(70, -1)).toEqual({ step: 6, octave: 4, alter: -1 }); // B♭4
    expect(spell(58, -2)).toEqual({ step: 6, octave: 3, alter: -1 }); // B♭3
  });

  it('keeps the octave right around the octave break', () => {
    expect(spell(59, 0)).toEqual({ step: 6, octave: 3, alter: 0 }); // B3
    expect(spell(73, -5)).toEqual({ step: 1, octave: 5, alter: -1 }); // D♭5
    expect(spell(22, -3)).toEqual({ step: 6, octave: 0, alter: -1 }); // B♭0
  });

  it('spells every black key of the piano in both directions', () => {
    for (let note = 21; note <= 108; note++) {
      for (const fifths of [-3, 0, 3]) {
        const spelled = spell(note, fifths);
        const back =
          (spelled.octave + 1) * 12 + [0, 2, 4, 5, 7, 9, 11][spelled.step] + spelled.alter;
        expect(back).toBe(note);
      }
    }
  });
});

describe('spell with a given spelling', () => {
  it('keeps a spelling that matches the pitch, even when the key says otherwise', () => {
    expect(spell(61, 0, { step: 1, alter: -1 })).toEqual({ step: 1, octave: 4, alter: -1 }); // D♭4
    expect(spell(65, 0, { step: 2, alter: 1 })).toEqual({ step: 2, octave: 4, alter: 1 }); // E♯4
  });

  it('writes C♭4 and B♯3 in the octave of their letter', () => {
    expect(spell(59, 0, { step: 0, alter: -1 })).toEqual({ step: 0, octave: 4, alter: -1 }); // C♭4
    expect(spell(60, 0, { step: 6, alter: 1 })).toEqual({ step: 6, octave: 3, alter: 1 }); // B♯3
  });

  it('falls back to the key when the spelling is not that pitch', () => {
    expect(spell(61, -5, { step: 0, alter: 0 })).toEqual({ step: 1, octave: 4, alter: -1 });
    expect(spell(62, 0, { step: 5, alter: 0 })).toEqual({ step: 1, octave: 4, alter: 0 });
  });
});

describe('alterFor and spellingFor', () => {
  it('finds the single sign that turns a step into a pitch', () => {
    expect(alterFor(61, 1)).toBe(-1); // D♭
    expect(alterFor(61, 0)).toBe(1); // C♯
    expect(alterFor(62, 1)).toBe(0);
  });

  it('refuses a double sharp or flat', () => {
    expect(alterFor(62, 0)).toBeUndefined(); // C𝄪
    expect(spellingFor(60, 1)).toBeUndefined(); // D𝄫
  });

  it('refuses a step outside C–B', () => {
    expect(spellingFor(60, 7)).toBeUndefined();
    expect(spellingFor(60, -1)).toBeUndefined();
    expect(spellingFor(60, 1.5)).toBeUndefined();
  });
});

describe('key signatures', () => {
  it('gives the alteration of each step', () => {
    expect(keyAlterations(0)).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(keyAlterations(2)).toEqual([1, 0, 0, 1, 0, 0, 0]); // F♯ C♯
    expect(keyAlterations(-5)).toEqual([0, -1, -1, 0, -1, -1, -1]); // B♭ E♭ A♭ D♭ G♭
    expect(keyAlterations(-1)).toEqual([0, 0, 0, 0, 0, 0, -1]); // B♭
    expect(keyAlterations(7)).toEqual([1, 1, 1, 1, 1, 1, 1]);
    expect(keyAlterations(-7)).toEqual([-1, -1, -1, -1, -1, -1, -1]);
  });

  it('puts the signs of every key at the standard places', () => {
    expect(keySignatureIndexes(0, 'treble')).toEqual([]);
    expect(keySignatureIndexes(7, 'treble')).toEqual([10, 7, 11, 8, 5, 9, 6]); // F5 C5 G5 D5 A4 E5 B4
    expect(keySignatureIndexes(-7, 'treble')).toEqual([6, 9, 5, 8, 4, 7, 3]); // B4 E5 A4 D5 G4 C5 F4
    expect(keySignatureIndexes(7, 'bass')).toEqual([-4, -7, -3, -6, -9, -5, -8]); // F3 C3 G3 D3 A2 E3 B2
    expect(keySignatureIndexes(-7, 'bass')).toEqual([-8, -5, -9, -6, -10, -7, -11]); // B2 E3 A2 D3 G2 C3 F2
  });

  it('draws the first signs of a shorter key', () => {
    expect(keySignatureIndexes(-5, 'treble')).toEqual([6, 9, 5, 8, 4]); // B♭ E♭ A♭ D♭ G♭
    expect(keySignatureIndexes(3, 'bass')).toEqual([-4, -7, -3]);
  });

  it('is symmetric: every key of both signs has the right count of signs', () => {
    for (let fifths = -7; fifths <= 7; fifths++) {
      expect(keySignatureIndexes(fifths, 'treble')).toHaveLength(Math.abs(fifths));
      expect(keySignatureIndexes(fifths, 'bass')).toHaveLength(Math.abs(fifths));
    }
  });
});
