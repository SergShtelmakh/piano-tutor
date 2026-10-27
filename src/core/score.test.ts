import { describe, expect, it } from 'vitest';
import { buildScore, stemDirection, type Column, type Score, type ScoreNote } from './score.ts';
import type { Piece, TimeSignature } from './smf.ts';

// One tick is one sixteenth note here (4 ticks per quarter), at 120 bpm: a sixteenth is 0.125 s.
function makePiece(
  notes: [note: number, start: number, end: number][],
  signatures: TimeSignature[] = [{ tick: 0, numerator: 4, denominator: 4 }],
): Piece {
  return {
    ticksPerQuarter: 4,
    notes: notes.map(([note, startTick, endTick]) => ({
      note,
      startTick,
      endTick,
      start: startTick * 0.125,
      end: endTick * 0.125,
      velocity: 80,
    })),
    pedal: [],
    tempos: [{ tick: 0, time: 0, microsPerQuarter: 500_000 }],
    timeSignatures: signatures,
    duration: 0,
  };
}

const C4 = 60;
const E4 = 64;
const G4 = 67;
const C3 = 48;

/** [unit, units, value+dots, rest] of every column of a staff, over all bars. */
function shape(score: Score, clef: 'treble' | 'bass') {
  return score.bars.flatMap((bar) =>
    bar.columns[clef].map((c: Column) => [
      c.unit,
      c.units,
      c.value + (c.dots ? '.' : ''),
      c.rest ? 'rest' : 'note',
    ]),
  );
}

describe('buildScore: bars', () => {
  it('makes one 4/4 bar of four quarter notes', () => {
    const score = buildScore(
      makePiece([
        [C4, 0, 4],
        [E4, 4, 8],
        [G4, 8, 12],
        [C4, 12, 16],
      ]),
    );
    expect(score.bars).toHaveLength(1);
    expect(score.bars[0]).toMatchObject({ number: 1, units: 16, showTimeSignature: true });
    expect(shape(score, 'treble')).toEqual([
      [0, 4, 'quarter', 'note'],
      [4, 4, 'quarter', 'note'],
      [8, 4, 'quarter', 'note'],
      [12, 4, 'quarter', 'note'],
    ]);
  });

  it('uses 3/4 and 6/8 bar lengths and follows a time-signature change', () => {
    const score = buildScore(
      makePiece(
        [
          [C4, 0, 12],
          [C4, 12, 24],
          [C4, 24, 36],
        ],
        [
          { tick: 0, numerator: 3, denominator: 4 },
          { tick: 24, numerator: 6, denominator: 8 },
        ],
      ),
    );
    expect(score.bars.map((bar) => [bar.startUnit, bar.units])).toEqual([
      [0, 12],
      [12, 12],
      [24, 12],
    ]);
    expect(score.bars.map((bar) => bar.showTimeSignature)).toEqual([true, false, true]);
    expect(score.bars[2].timeSignature).toEqual({ numerator: 6, denominator: 8 });
  });

  it('gives bars their start and end times', () => {
    const score = buildScore(
      makePiece([
        [C4, 0, 16],
        [C4, 16, 32],
      ]),
    );
    expect(score.bars.map((bar) => [bar.startTime, bar.endTime])).toEqual([
      [0, 2],
      [2, 4],
    ]);
  });

  it('reports the lowest and highest note', () => {
    const score = buildScore(
      makePiece([
        [C3, 0, 4],
        [G4, 4, 8],
      ]),
    );
    expect([score.low, score.high]).toEqual([C3, G4]);
  });
});

describe('buildScore: note values', () => {
  it('draws half, dotted quarter, eighth, and sixteenth', () => {
    const score = buildScore(
      makePiece([
        [C4, 0, 8], // half
        [C4, 8, 14], // dotted quarter
        [C4, 14, 16], // eighth
      ]),
    );
    expect(shape(score, 'treble').map((c) => c[2])).toEqual(['half', 'quarter.', 'eighth']);
  });

  it('draws a whole note for a full 4/4 bar and a dotted half for a full 3/4 bar', () => {
    expect(shape(buildScore(makePiece([[C4, 0, 16]])), 'treble')[0].slice(1, 3)).toEqual([
      16,
      'whole',
    ]);
    const three = buildScore(makePiece([[C4, 0, 12]], [{ tick: 0, numerator: 3, denominator: 4 }]));
    expect(shape(three, 'treble')[0].slice(1, 3)).toEqual([12, 'half.']);
  });

  it('splits a five-sixteenth note into a quarter and a sixteenth, tied', () => {
    const score = buildScore(
      makePiece([
        [C4, 0, 5],
        [C4, 8, 16],
      ]),
    );
    const [first, second] = score.bars[0].columns.treble;
    expect([first.value, second.value]).toEqual(['quarter', 'sixteenth']);
    expect(first.notes[0].tieNext).toBe(true);
    expect(second.notes[0].tiePrev).toBe(true);
    expect(second.notes[0].tieNext).toBe(false);
  });

  it('rounds starts and ends to the nearest sixteenth', () => {
    // 480 ticks per quarter: a sixteenth is 120 ticks. 125 rounds to 1, 235 to 2.
    const piece = makePiece([[C4, 0, 4]]);
    const rough: Piece = {
      ...piece,
      ticksPerQuarter: 480,
      notes: [{ ...piece.notes[0], startTick: 125, endTick: 475 }],
    };
    const column = buildScore(rough).bars[0].columns.treble.find((c) => !c.rest)!;
    expect([column.unit, column.units]).toEqual([1, 3]);
  });
});

describe('buildScore: ties and bar lines', () => {
  it('ties a note across a bar line', () => {
    const score = buildScore(makePiece([[C4, 8, 24]]));
    const [firstBar, secondBar] = score.bars;
    const held = firstBar.columns.treble.find((c) => !c.rest)!;
    const rest = secondBar.columns.treble.find((c) => !c.rest)!;
    expect([held.unit, held.units, held.value]).toEqual([8, 8, 'half']);
    expect(held.notes[0].tieNext).toBe(true);
    expect([rest.unit, rest.units, rest.value]).toEqual([16, 8, 'half']);
    expect(rest.notes[0].tiePrev).toBe(true);
  });

  it('ties every note of a chord across the bar line', () => {
    const score = buildScore(
      makePiece([
        [C4, 8, 24],
        [E4, 8, 24],
      ]),
    );
    const held = score.bars[0].columns.treble.find((c) => !c.rest)!;
    expect(held.notes.map((n) => n.tieNext)).toEqual([true, true]);
  });
});

describe('buildScore: rests', () => {
  it('fills gaps with rests', () => {
    const score = buildScore(
      makePiece([
        [C4, 4, 8],
        [C4, 12, 16],
      ]),
    );
    expect(shape(score, 'treble')).toEqual([
      [0, 4, 'quarter', 'rest'],
      [4, 4, 'quarter', 'note'],
      [8, 4, 'quarter', 'rest'],
      [12, 4, 'quarter', 'note'],
    ]);
  });

  it('draws one whole rest for an empty bar, whatever the metre', () => {
    const score = buildScore(
      makePiece(
        [
          [C4, 0, 12],
          [C4, 12, 24],
        ],
        [{ tick: 0, numerator: 3, denominator: 4 }],
      ),
    );
    // The bass staff never plays: a whole-bar rest in each 3/4 bar.
    expect(shape(score, 'bass')).toEqual([
      [0, 12, 'whole', 'rest'],
      [12, 12, 'whole', 'rest'],
    ]);
  });

  it('pads the last bar with rests', () => {
    const score = buildScore(makePiece([[C4, 0, 4]]));
    expect(shape(score, 'treble')).toEqual([
      [0, 4, 'quarter', 'note'],
      [4, 12, 'half.', 'rest'],
    ]);
  });
});

describe('buildScore: staves, chords, voices', () => {
  it('puts C4 and above on the treble staff and lower notes on the bass staff', () => {
    const score = buildScore(
      makePiece([
        [C4, 0, 4],
        [C3, 0, 4],
      ]),
    );
    expect(score.bars[0].columns.treble[0].notes.map((n) => n.note)).toEqual([C4]);
    expect(score.bars[0].columns.bass[0].notes.map((n) => n.note)).toEqual([C3]);
  });

  it('stacks a chord, lowest note first, without duplicates', () => {
    const score = buildScore(
      makePiece([
        [G4, 0, 4],
        [C4, 0, 4],
        [E4, 0, 4],
        [C4, 0, 4],
      ]),
    );
    expect(score.bars[0].columns.treble[0].notes.map((n) => n.note)).toEqual([C4, E4, G4]);
  });

  it('moves the upper note of a second to the right', () => {
    const score = buildScore(
      makePiece([
        [C4, 0, 4],
        [62, 0, 4],
      ]),
    );
    expect(score.bars[0].columns.treble[0].notes.map((n) => n.shifted)).toEqual([false, true]);
  });

  it('keeps the third of a triad in place', () => {
    const score = buildScore(
      makePiece([
        [C4, 0, 4],
        [E4, 0, 4],
        [G4, 0, 4],
      ]),
    );
    expect(score.bars[0].columns.treble[0].notes.map((n) => n.shifted)).toEqual([
      false,
      false,
      false,
    ]);
  });

  it('shows a note until the next one starts on the same staff (one voice)', () => {
    // C4 is held for a whole bar, but E4 starts after a quarter: C4 is shown as a quarter.
    const score = buildScore(
      makePiece([
        [C4, 0, 16],
        [E4, 4, 8],
      ]),
    );
    expect(shape(score, 'treble').slice(0, 2)).toEqual([
      [0, 4, 'quarter', 'note'],
      [4, 4, 'quarter', 'note'],
    ]);
  });

  it('puts ledger lines on notes below and above the staves', () => {
    const score = buildScore(
      makePiece([
        [C4, 0, 4],
        [84, 4, 8],
      ]),
    );
    const [middleC, highC] = score.bars[0].columns.treble.filter((c) => !c.rest);
    expect(middleC.notes[0].ledger).toEqual([0]);
    expect(highC.notes[0].ledger.length).toBeGreaterThan(1);
  });
});

describe('buildScore: accidentals', () => {
  const sharpC = 61;

  it('draws a sharp for a black key', () => {
    const score = buildScore(makePiece([[sharpC, 0, 4]]));
    expect(score.bars[0].columns.treble[0].notes[0].accidental).toBe('sharp');
  });

  it('draws no second sharp for the same note in the bar', () => {
    const score = buildScore(
      makePiece([
        [sharpC, 0, 4],
        [sharpC, 4, 8],
      ]),
    );
    const [first, second] = score.bars[0].columns.treble;
    expect([first.notes[0].accidental, second.notes[0].accidental]).toEqual(['sharp', null]);
  });

  it('draws a natural when the white key follows a sharp of the same position', () => {
    const score = buildScore(
      makePiece([
        [sharpC, 0, 4],
        [C4, 4, 8],
        [C4, 8, 12],
      ]),
    );
    const [first, second, third] = score.bars[0].columns.treble;
    expect([first, second, third].map((c) => c.notes[0].accidental)).toEqual([
      'sharp',
      'natural',
      null,
    ]);
  });

  it('starts every bar without accidentals', () => {
    const score = buildScore(
      makePiece([
        [sharpC, 0, 4],
        [sharpC, 16, 20],
      ]),
    );
    expect(score.bars[1].columns.treble[0].notes[0].accidental).toBe('sharp');
  });

  it('does not repeat the sharp on a note tied over the bar line', () => {
    const score = buildScore(makePiece([[sharpC, 8, 24]]));
    const tied = score.bars[1].columns.treble.find((c) => !c.rest)!;
    expect(tied.notes[0].tiePrev).toBe(true);
    expect(tied.notes[0].accidental).toBeNull();
  });
});

describe('buildScore: time', () => {
  it('gives each column the time of its rounded start, following tempo changes', () => {
    const piece = makePiece([
      [C4, 0, 4],
      [C4, 4, 8],
    ]);
    // From tick 4 on the tempo is twice as slow: a sixteenth takes 0.25 s.
    const slowed: Piece = {
      ...piece,
      tempos: [
        { tick: 0, time: 0, microsPerQuarter: 500_000 },
        { tick: 4, time: 0.5, microsPerQuarter: 1_000_000 },
      ],
    };
    const times = buildScore(slowed).bars[0].columns.treble.map((c) => c.time);
    expect(times.slice(0, 2)).toEqual([0, 0.5]);
  });

  it('keeps column times non-decreasing along the piece', () => {
    const score = buildScore(
      makePiece([
        [C4, 0, 3],
        [E4, 3, 9],
        [G4, 9, 20],
        [C3, 2, 30],
        [C4, 40, 41],
      ]),
    );
    const times = score.bars.flatMap((bar) => bar.columns.treble.map((c) => c.time));
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });
});

describe('stemDirection', () => {
  const note = (index: number) => ({ index }) as ScoreNote;

  it('points up below the middle line and down at or above it', () => {
    expect(stemDirection([note(2)], 'treble')).toBe('up');
    expect(stemDirection([note(6)], 'treble')).toBe('down');
    expect(stemDirection([note(9)], 'treble')).toBe('down');
    expect(stemDirection([note(-9)], 'bass')).toBe('up');
    expect(stemDirection([note(-3)], 'bass')).toBe('down');
  });

  it('goes by the middle of a chord', () => {
    expect(stemDirection([note(2), note(8)], 'treble')).toBe('up'); // the middle is 5
    expect(stemDirection([note(4), note(10)], 'treble')).toBe('down'); // the middle is 7
  });
});
