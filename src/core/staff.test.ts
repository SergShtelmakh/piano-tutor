import { describe, expect, it } from 'vitest';
import { NOTE_READING_POOL } from './lessons.ts';
import { staffPosition } from './staff.ts';

const C4 = 60;

describe('staffPosition', () => {
  it('puts middle C on a ledger line of the treble staff', () => {
    expect(staffPosition(C4)).toEqual({ clef: 'treble', index: 0, ledger: [0] });
  });

  it('puts D4 below the treble staff without a ledger line', () => {
    expect(staffPosition(C4 + 2)).toEqual({ clef: 'treble', index: 1, ledger: [] });
  });

  it('puts E4 on the bottom treble line', () => {
    expect(staffPosition(64)).toEqual({ clef: 'treble', index: 2, ledger: [] });
  });

  it('places the notes inside the treble staff', () => {
    expect(staffPosition(67)?.index).toBe(4); // G4, second line
    expect(staffPosition(71)?.index).toBe(6); // B4, middle line
    expect(staffPosition(77)?.index).toBe(10); // F5, top line
  });

  it('puts C5 in the space above B4 without a ledger line', () => {
    expect(staffPosition(72)).toEqual({ clef: 'treble', index: 7, ledger: [] });
  });

  it('adds a ledger line above the staff from A5', () => {
    expect(staffPosition(81)).toEqual({ clef: 'treble', index: 12, ledger: [12] });
    expect(staffPosition(79)).toEqual({ clef: 'treble', index: 11, ledger: [] }); // G5, space
  });

  it('puts B3 on the bass staff, in the space above the top line', () => {
    expect(staffPosition(59)).toEqual({ clef: 'bass', index: -1, ledger: [] });
  });

  it('puts A3 on the top bass line and G2 on the bottom bass line', () => {
    expect(staffPosition(57)).toEqual({ clef: 'bass', index: -2, ledger: [] });
    expect(staffPosition(43)).toEqual({ clef: 'bass', index: -10, ledger: [] });
  });

  it('adds ledger lines below the bass staff from E2', () => {
    expect(staffPosition(41)).toEqual({ clef: 'bass', index: -11, ledger: [] }); // F2, space
    expect(staffPosition(40)).toEqual({ clef: 'bass', index: -12, ledger: [-12] }); // E2
    expect(staffPosition(36)).toEqual({ clef: 'bass', index: -14, ledger: [-14, -12] }); // C2
  });

  it('keeps one octave exactly seven steps apart', () => {
    for (const note of [60, 62, 64, 65, 67, 69, 71]) {
      expect(staffPosition(note + 12)!.index - staffPosition(note)!.index).toBe(7);
    }
  });

  it('rejects black keys', () => {
    for (const note of [61, 63, 66, 68, 70, 58, 73]) {
      expect(staffPosition(note), String(note)).toBeNull();
    }
  });

  it('knows every note of the note reading lesson', () => {
    expect(NOTE_READING_POOL.map((n) => staffPosition(n)?.index)).toEqual([
      -1, 0, 1, 2, 3, 4, 5, 6, 7,
    ]);
    const clefs = NOTE_READING_POOL.map((n) => staffPosition(n)?.clef);
    expect(clefs.filter((clef) => clef === 'bass')).toHaveLength(1);
  });
});
