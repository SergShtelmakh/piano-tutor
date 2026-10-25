import { describe, expect, it } from 'vitest';
import { clampBaseOctave, isBlackKey, keyboardRange, octaveOf, pitchClass } from './notes.ts';

describe('notes', () => {
  it('knows black and white keys', () => {
    const black = [1, 3, 6, 8, 10].map((n) => 60 + n);
    for (let n = 60; n < 72; n++) expect(isBlackKey(n)).toBe(black.includes(n));
  });

  it('numbers octaves with C4 = 60', () => {
    expect(octaveOf(60)).toBe(4);
    expect(octaveOf(59)).toBe(3);
    expect(octaveOf(21)).toBe(0);
    expect(octaveOf(0)).toBe(-1);
    expect(pitchClass(60)).toBe(0);
    expect(pitchClass(71)).toBe(11);
  });

  it('builds the 25-note range for a base octave', () => {
    const range = keyboardRange(3);
    expect(range).toHaveLength(25);
    expect(range[0]).toBe(48);
    expect(range[24]).toBe(72);
    expect(range[12]).toBe(60);
  });

  it('clamps the base octave to C1–C6', () => {
    expect(clampBaseOctave(0)).toBe(1);
    expect(clampBaseOctave(9)).toBe(6);
    expect(clampBaseOctave(4)).toBe(4);
  });
});
