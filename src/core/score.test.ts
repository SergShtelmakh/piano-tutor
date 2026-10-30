import { describe, expect, it } from 'vitest';
import {
  buildScore,
  gapStepsFor,
  stemDirection,
  type Column,
  type Score,
  type ScoreNote,
} from './score.ts';
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

describe('buildScore with hands', () => {
  const withHands = (notes: [number, number, number, 'right' | 'left' | undefined][]): Piece => {
    const piece = makePiece(notes.map(([note, start, end]) => [note, start, end]));
    return {
      ...piece,
      notes: piece.notes.map((note, i) => (notes[i][3] ? { ...note, hand: notes[i][3] } : note)),
    };
  };

  it('draws a right-hand note below middle C on the treble staff', () => {
    const score = buildScore(withHands([[59, 0, 4, 'right']])); // B3
    expect(score.bars[0].columns.bass.every((column) => column.rest)).toBe(true);
    const note = score.bars[0].columns.treble.find((column) => !column.rest)!.notes[0];
    expect(note.index).toBe(-1);
    expect(note.ledger).toEqual([0]);
  });

  it('draws a left-hand note above middle C on the bass staff', () => {
    const score = buildScore(withHands([[62, 0, 4, 'left']])); // D4
    expect(score.bars[0].columns.treble.every((column) => column.rest)).toBe(true);
    const note = score.bars[0].columns.bass.find((column) => !column.rest)!.notes[0];
    expect(note.index).toBe(1);
    expect(note.ledger).toEqual([0]);
  });

  it('splits at middle C for notes without a hand, as before', () => {
    const score = buildScore(
      withHands([
        [59, 0, 4, undefined],
        [62, 0, 4, undefined],
      ]),
    );
    expect(score.bars[0].columns.bass.find((c) => !c.rest)!.notes.map((n) => n.note)).toEqual([59]);
    expect(score.bars[0].columns.treble.find((c) => !c.rest)!.notes.map((n) => n.note)).toEqual([
      62,
    ]);
  });
});

describe('buildScore: key signature and spelling', () => {
  // 4 ticks per quarter, so a quarter note is [start, start + 4] and a 4/4 bar is 16 ticks.
  const inKey = (
    fifths: number,
    notes: [number, number, number, { step: number; alter: -1 | 0 | 1 }?][],
    extraKeys: { tick: number; fifths: number }[] = [],
  ): Piece => {
    const piece = makePiece(notes.map(([note, start, end]) => [note, start, end]));
    return {
      ...piece,
      keySignatures: [{ tick: 0, fifths }, ...extraKeys],
      notes: piece.notes.map((note, i) =>
        notes[i][3] ? { ...note, spelling: notes[i][3] } : note,
      ),
    };
  };
  const columnNotes = (score: Score, clef: 'treble' | 'bass', bar = 0) =>
    score.bars[bar].columns[clef].filter((c) => !c.rest).flatMap((c) => c.notes);

  it('records the key of each bar and where it changes', () => {
    const score = buildScore(
      inKey(
        -2,
        [
          [60, 0, 4],
          [62, 16, 20],
          [64, 32, 36],
        ],
        [{ tick: 32, fifths: 1 }],
      ),
    );
    expect(score.bars.map((b) => [b.keySignature, b.showKeySignature])).toEqual([
      [-2, true],
      [-2, false],
      [1, true],
    ]);
  });

  it('spells a black key with a flat in a flat key and puts it on the flat letter', () => {
    const score = buildScore(inKey(-5, [[61, 0, 4]])); // D♭4 in D♭ major
    const [note] = columnNotes(score, 'treble');
    expect(note.index).toBe(1); // the D position, not C
    expect(note.alter).toBe(-1);
    expect(note.accidental).toBeNull(); // the key signature already has D♭
  });

  it('draws no sign for notes the key signature gives', () => {
    const score = buildScore(
      inKey(-3, [
        [63, 0, 4],
        [68, 4, 8],
        [70, 8, 12],
      ]),
    ); // E♭ A♭ B♭
    expect(columnNotes(score, 'treble').map((n) => n.accidental)).toEqual([null, null, null]);
  });

  it('draws a natural against the key, and it holds for the bar only', () => {
    // B♭ major (one flat): B natural, then B natural again, then next bar B♭ and B natural.
    const score = buildScore(
      inKey(-1, [
        [71, 0, 4],
        [71, 4, 8],
        [70, 16, 20],
        [71, 20, 24],
      ]),
    );
    expect(columnNotes(score, 'treble', 0).map((n) => n.accidental)).toEqual(['natural', null]);
    expect(columnNotes(score, 'treble', 1).map((n) => n.accidental)).toEqual([null, 'natural']);
  });

  it('draws a flat when a note is lowered against the key, and a sharp when it is raised', () => {
    const inC = buildScore(inKey(0, [[70, 0, 4, { step: 6, alter: -1 }]])); // B♭ written in C major
    expect(columnNotes(inC, 'treble')[0].accidental).toBe('flat');
    const inG = buildScore(inKey(1, [[65, 0, 4]])); // F natural in G major (F♯ in the key)
    expect(columnNotes(inG, 'treble')[0].accidental).toBe('natural');
    // A spelling that is not that pitch (a G written as F♯) falls back to the key.
    const mismatch = buildScore(inKey(1, [[67, 0, 4, { step: 3, alter: 1 }]]));
    expect(columnNotes(mismatch, 'treble')[0].alter).toBe(0);
  });

  it('writes sharp keys with sharps', () => {
    const score = buildScore(
      inKey(2, [
        [66, 0, 4],
        [73, 4, 8],
      ]),
    ); // F♯4, C♯5 in D major
    const notes = columnNotes(score, 'treble');
    expect(notes.map((n) => [n.index, n.alter, n.accidental])).toEqual([
      [3, 1, null],
      [7, 1, null],
    ]);
  });

  it('keeps a spelling from the file even against the key (E♯ in C major)', () => {
    const score = buildScore(inKey(0, [[65, 0, 4, { step: 2, alter: 1 }]])); // E♯4 sounds as F4
    const [note] = columnNotes(score, 'treble');
    expect(note.index).toBe(2); // the E position
    expect(note.accidental).toBe('sharp');
  });

  it('does not repeat a sign on a note tied over the bar line', () => {
    const score = buildScore(inKey(0, [[61, 12, 20]])); // C♯4 tied across the bar
    expect(columnNotes(score, 'treble', 0)[0].accidental).toBe('sharp');
    expect(columnNotes(score, 'treble', 1)[0].accidental).toBeNull();
  });

  it('is unchanged for a piece without a key signature (C major, sharps)', () => {
    const score = buildScore(
      makePiece([
        [61, 0, 4],
        [60, 4, 8],
        [61, 8, 12],
      ]),
    );
    expect(columnNotes(score, 'treble').map((n) => n.accidental)).toEqual([
      'sharp',
      'natural',
      'sharp',
    ]);
    expect(score.bars[0].keySignature).toBe(0);
  });
});

describe('measureBars: space between the staves', () => {
  const gapOf = (notes: [number, number, number, 'right' | 'left' | undefined][]) => {
    const piece = makePiece(notes.map(([note, start, end]) => [note, start, end]));
    const withHands = {
      ...piece,
      notes: piece.notes.map((note, i) => (notes[i][3] ? { ...note, hand: notes[i][3]! } : note)),
    };
    return buildScore(withHands).gapSteps;
  };

  it('is four staff spaces (8 steps) when nothing sits between the staves', () => {
    expect(
      gapOf([
        [72, 0, 4, undefined],
        [48, 0, 4, undefined],
      ]),
    ).toBe(8);
  });

  it('grows with a left-hand note above middle C (F4 on the bass staff)', () => {
    // F4 is index 3 on the bass staff, 1 above the treble staff's bottom line? (index 2): 8 + 3 - 2.
    expect(gapOf([[65, 0, 4, 'left']])).toBe(9);
    expect(
      gapOf([
        [65, 0, 4, 'left'],
        [74, 0, 4, 'left'],
      ]),
    ).toBe(8 + 8 - 2); // D5 = index 8
  });

  it('grows with a right-hand note far below middle C', () => {
    // A2 is index -9 on the treble staff: the bass staff has to move down by that much more.
    expect(gapOf([[45, 0, 4, 'right']])).toBe(8 + -2 - -9);
  });

  it('reports the highest treble and the lowest bass index for the vertical room', () => {
    const piece = makePiece([
      [84, 0, 4],
      [36, 0, 4],
    ]); // C6 and C2
    const score = buildScore(piece);
    expect(score.highIndex).toBe(7 * 2 + 0); // C6 = index 14
    expect(score.lowIndex).toBe(-14); // C2
  });
});

describe('gapStepsFor', () => {
  it('is four staff spaces for the white-key lessons (middle C above, B3 below)', () => {
    expect(gapStepsFor(0, -1)).toBe(8);
  });

  it('grows with a bass note above the lowest treble note, and ignores treble notes above the staff edge', () => {
    expect(gapStepsFor(2, 3)).toBe(9);
    expect(gapStepsFor(12, -1)).toBe(8); // the treble low is the staff edge (2) at most
    expect(gapStepsFor(-9, -2)).toBe(15);
  });
});

describe('buildScore: two voices on a staff', () => {
  // 4 ticks per quarter, a 4/4 bar is 16 ticks; voice 2 is the lower voice.
  const voiced = (notes: [note: number, start: number, end: number, voice?: 2][]): Piece => {
    const piece = makePiece(notes.map(([note, start, end]) => [note, start, end]));
    return {
      ...piece,
      notes: piece.notes.map((note, i) =>
        notes[i][3] === 2 ? { ...note, voice: 2 as const } : note,
      ),
    };
  };
  const columns = (score: Score, bar = 0) => score.bars[bar].columns.treble;
  const melody = (pitch = 84): [number, number, number][] => [
    [pitch, 0, 4],
    [pitch, 4, 8],
    [pitch, 8, 12],
    [pitch, 12, 16],
  ];

  it('keeps a held note of the lower voice whole while the upper voice moves', () => {
    const score = buildScore(voiced([...melody(), [60, 0, 16, 2]]));
    const all = columns(score);
    expect(all.map((c) => [c.unit, c.voice, c.value])).toEqual([
      [0, 1, 'quarter'],
      [0, 2, 'whole'],
      [4, 1, 'quarter'],
      [8, 1, 'quarter'],
      [12, 1, 'quarter'],
    ]);
  });

  it('points the upper voice up and the lower voice down in a two-voice bar', () => {
    const all = columns(buildScore(voiced([...melody(), [60, 0, 16, 2]])));
    expect(all.filter((c) => c.voice === 1).every((c) => c.stem === 'up')).toBe(true);
    expect(all.filter((c) => c.voice === 2).every((c) => c.stem === 'down')).toBe(true);
  });

  it('draws a bar with one voice as before: no forced stems, no lower columns', () => {
    const score = buildScore(voiced([...melody(), [60, 0, 16, 2], [84, 16, 32]]));
    const second = columns(score, 1);
    expect(second.every((c) => c.voice === 1 && c.stem === undefined)).toBe(true);
    expect(second.some((c) => c.voice === 2)).toBe(false);
  });

  it('draws a bar where only the lower voice plays as one voice', () => {
    const score = buildScore(
      voiced([
        [84, 0, 16],
        [60, 16, 20, 2],
        [84, 32, 48],
      ]),
    );
    const second = columns(score, 1);
    expect(second.every((c) => c.voice === 1 && c.stem === undefined)).toBe(true);
    expect(second.filter((c) => !c.rest).map((c) => c.notes[0].note)).toEqual([60]);
  });

  it('draws lower-voice rests only in bars where it plays, moved down', () => {
    // Bar 1: the lower voice plays one quarter on the third beat; bar 2 has no lower voice.
    const score = buildScore(
      voiced([
        ...melody(),
        [60, 8, 12, 2],
        ...melody().map(([n, s, e]): [number, number, number] => [n, s + 16, e + 16]),
      ]),
    );
    const first = columns(score, 0);
    const lowerRests = first.filter((c) => c.voice === 2 && c.rest);
    expect(lowerRests.length).toBeGreaterThan(0);
    expect(lowerRests.every((c) => c.restShift === -2)).toBe(true);
    expect(columns(score, 1).some((c) => c.voice === 2)).toBe(false);
  });

  it('moves the rests of the upper voice up in a two-voice bar', () => {
    const score = buildScore(
      voiced([
        [84, 0, 4],
        [60, 0, 16, 2],
      ]),
    );
    const rests = columns(score).filter((c) => c.voice === 1 && c.rest);
    expect(rests.length).toBeGreaterThan(0);
    expect(rests.every((c) => c.restShift === 2)).toBe(true);
  });

  it('shares an accidental across voices on one staff position', () => {
    // C♯5 in the upper voice, then C♯5 in the lower voice in the same bar: the sign is drawn once.
    const score = buildScore(
      voiced([
        [73, 0, 4],
        [73, 4, 8, 2],
        [84, 8, 12],
      ]),
    );
    const signs = columns(score)
      .filter((c) => !c.rest)
      .map((c) => c.notes[0].accidental);
    expect(signs).toEqual(['sharp', null, null]);
  });

  it('moves the lower voice aside where the noteheads would touch', () => {
    const near = buildScore(
      voiced([
        [72, 0, 4],
        [71, 0, 4, 2],
      ]),
    );
    expect(columns(near).find((c) => c.voice === 2 && !c.rest)?.offset).toBe(true);
    const unison = buildScore(
      voiced([
        [72, 0, 4],
        [72, 0, 4, 2],
      ]),
    );
    expect(columns(unison).find((c) => c.voice === 2 && !c.rest)?.offset).toBe(true);
    const far = buildScore(
      voiced([
        [72, 0, 4],
        [64, 0, 4, 2],
      ]),
    );
    expect(columns(far).find((c) => c.voice === 2 && !c.rest)?.offset).toBeUndefined();
  });

  it('builds a score without voices exactly as one voice', () => {
    const score = buildScore(
      makePiece([
        [60, 0, 4],
        [64, 4, 8],
        [48, 0, 16],
      ]),
    );
    for (const bar of score.bars) {
      for (const column of [...bar.columns.treble, ...bar.columns.bass]) {
        expect(column.voice).toBe(1);
        expect(column.stem).toBeUndefined();
        expect(column.restShift).toBeUndefined();
        expect(column.offset).toBeUndefined();
      }
    }
  });
});
