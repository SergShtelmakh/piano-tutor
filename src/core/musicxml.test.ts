import { describe, expect, it } from 'vitest';
import { parseMusicXml } from './musicxml.ts';
import {
  attributes,
  backup,
  forward,
  measure,
  note,
  part,
  pedal,
  rest,
  score,
} from './musicxmlTestHelpers.ts';
import type { Piece } from './smf.ts';

function parse(xml: string): Piece {
  const result = parseMusicXml(xml);
  if (!result.ok) throw new Error(`parse failed: ${result.error}`);
  return result.piece;
}

const simple = (...content: string[]) =>
  parse(score([part('P1', measure(attributes({ divisions: 1, beats: '4' }), ...content))]));

describe('parseMusicXml: notes', () => {
  it('reads step, alter, and octave', () => {
    const piece = simple(
      note('C', 4, 1),
      note('C', 4, 1, { alter: 1 }),
      note('B', 3, 1, { alter: -1 }),
      note('A', 0, 1),
    );
    expect(piece.notes.map((n) => n.note).sort((a, b) => a - b)).toEqual([21, 58, 60, 61]);
  });

  it('places notes by duration and counts rests', () => {
    const piece = simple(note('C', 4, 1), rest(2), note('D', 4, 1));
    expect(piece.notes.map((n) => [n.note, n.startTick, n.endTick])).toEqual([
      [60, 0, 1],
      [62, 3, 4],
    ]);
  });

  it('follows a change of divisions inside a part', () => {
    const piece = parse(
      score([
        part(
          'P1',
          measure(attributes({ divisions: 2, beats: '2' }), note('C', 4, 2), note('D', 4, 2)),
          measure(attributes({ divisions: 4 }), note('E', 4, 4), note('F', 4, 4)),
        ),
      ]),
    );
    expect(piece.ticksPerQuarter).toBe(4);
    expect(piece.notes.map((n) => [n.note, n.startTick, n.endTick])).toEqual([
      [60, 0, 4],
      [62, 4, 8],
      [64, 8, 12],
      [65, 12, 16],
    ]);
  });

  it('starts chord notes together', () => {
    const piece = simple(note('C', 4, 2), note('E', 4, 2, { chord: true }), note('G', 4, 2));
    expect(piece.notes.map((n) => [n.note, n.startTick])).toEqual([
      [60, 0],
      [64, 0],
      [67, 2],
    ]);
  });

  it('puts two voices on one timeline with backup and forward', () => {
    const piece = simple(
      note('E', 5, 4, { voice: 1 }),
      backup(4),
      note('C', 4, 2, { voice: 2 }),
      note('D', 4, 1, { voice: 2 }),
      forward(1),
    );
    expect(piece.notes.map((n) => [n.note, n.startTick])).toEqual([
      [60, 0],
      [76, 0],
      [62, 2],
    ]);
  });

  it('starts the next measure after the longest voice', () => {
    const piece = parse(
      score([
        part(
          'P1',
          measure(attributes({ divisions: 1, beats: '4' }), note('C', 4, 4), backup(4), rest(2)),
          measure(note('D', 4, 4)),
        ),
      ]),
    );
    expect(piece.notes.map((n) => n.startTick)).toEqual([0, 4]);
  });

  it('joins tied notes into one', () => {
    const piece = parse(
      score([
        part(
          'P1',
          measure(
            attributes({ divisions: 1, beats: '4' }),
            rest(2),
            note('C', 4, 2, { tie: 'start' }),
          ),
          measure(note('C', 4, 2, { tie: 'both' }), note('D', 4, 2)),
          measure(note('C', 4, 4, { tie: 'stop' })),
        ),
      ]),
    );
    const c = piece.notes.filter((n) => n.note === 60);
    expect(c).toHaveLength(1);
    expect([c[0].startTick, c[0].endTick]).toEqual([2, 12]);
  });

  it('skips grace notes, and cue notes sound nothing but still take time', () => {
    const piece = simple(
      note('D', 4, 0, { grace: true }),
      note('C', 4, 1),
      note('G', 5, 2, { cue: true }),
      note('E', 4, 1),
    );
    expect(piece.notes.map((n) => [n.note, n.startTick])).toEqual([
      [60, 0],
      [64, 3],
    ]);
  });

  it('adds the transposition of the part', () => {
    const piece = parse(
      score([
        part(
          'P1',
          measure(attributes({ divisions: 1, beats: '4', transpose: -2 }), note('C', 5, 4)),
        ),
      ]),
    );
    expect(piece.notes[0].note).toBe(70);
  });
});

describe('parseMusicXml: parts and hands', () => {
  it('merges parts and ignores percussion parts and unpitched notes', () => {
    const xml = score(
      [
        part('P1', measure(attributes({ divisions: 1, beats: '4' }), note('C', 4, 4))),
        part('P2', measure(attributes({ divisions: 1 }), note('G', 3, 4))),
        part('P3', measure(attributes({ divisions: 1 }), note('C', 2, 4))),
        part(
          'P4',
          measure(
            attributes({ divisions: 1 }),
            note('C', 2, 2, { unpitched: true }),
            note('A', 4, 2),
          ),
        ),
      ],
      ['P3'],
    );
    expect(parse(xml).notes.map((n) => n.note)).toEqual([55, 60, 69]);
  });

  it('takes the hand from the staff of a two-staff part', () => {
    const piece = parse(
      score([
        part(
          'P1',
          measure(
            attributes({ divisions: 1, beats: '4', staves: 2 }),
            note('B', 3, 4, { staff: 1 }),
            backup(4),
            note('D', 4, 4, { staff: 2 }),
          ),
        ),
      ]),
    );
    const byNote = Object.fromEntries(piece.notes.map((n) => [n.note, n.hand]));
    expect(byNote).toEqual({ 59: 'right', 62: 'left' });
  });

  it('leaves the hand unset for a one-staff part and for MIDI-style data', () => {
    expect(simple(note('C', 4, 4)).notes[0].hand).toBeUndefined();
  });
});

describe('parseMusicXml: time', () => {
  it('uses 120 bpm: a quarter note lasts half a second', () => {
    const piece = simple(note('C', 4, 2), note('D', 4, 2));
    expect(piece.notes[1].start).toBeCloseTo(1);
    expect(piece.duration).toBeCloseTo(2);
    expect(piece.tempos).toHaveLength(1);
  });

  it('defaults to 4/4 and reads time signature changes', () => {
    const none = parse(score([part('P1', measure(attributes({ divisions: 1 }), note('C', 4, 4)))]));
    expect(none.timeSignatures).toEqual([{ tick: 0, numerator: 4, denominator: 4 }]);

    const changed = parse(
      score([
        part(
          'P1',
          measure(attributes({ divisions: 1, beats: '4' }), note('C', 4, 4)),
          measure(attributes({ beats: '3+2', beatType: 8 }), note('D', 4, 2)),
        ),
      ]),
    );
    expect(changed.timeSignatures).toEqual([
      { tick: 0, numerator: 4, denominator: 4 },
      { tick: 4, numerator: 5, denominator: 8 },
    ]);
  });

  it('pads a pickup bar so bar lines match the file', () => {
    const piece = parse(
      score([
        part(
          'P1',
          measure(attributes({ divisions: 1, beats: '4' }), note('G', 4, 1)),
          measure(note('C', 5, 4)),
        ),
      ]),
    );
    expect(piece.notes.map((n) => [n.note, n.startTick])).toEqual([
      [67, 3],
      [72, 4],
    ]);
  });

  it('does not pad a full first bar', () => {
    expect(simple(note('C', 4, 4)).notes[0].startTick).toBe(0);
  });

  it('reads pedal start, stop, and change', () => {
    const piece = simple(
      pedal('start'),
      note('C', 4, 2),
      pedal('change'),
      note('D', 4, 1),
      pedal('stop'),
      rest(1),
    );
    expect(piece.pedal.map((p) => [p.tick, p.on])).toEqual([
      [0, true],
      [2, false],
      [2, true],
      [3, false],
    ]);
  });
});

describe('parseMusicXml: errors', () => {
  it.each([
    ['not xml at all', 'damaged'],
    ['<score-partwise><part></score-partwise>', 'damaged'],
    ['<score-timewise/>', 'unsupported'],
    ['<html/>', 'notMidi'],
  ])('%s -> %s', (text, error) => {
    expect(parseMusicXml(text)).toEqual({ ok: false, error });
  });

  it('reports a score without pitched notes as empty', () => {
    const xml = score([part('P1', measure(attributes({ divisions: 1, beats: '4' }), rest(4)))]);
    expect(parseMusicXml(xml)).toEqual({ ok: false, error: 'empty' });
  });

  it('refuses too many notes', () => {
    const notes = Array.from({ length: 50_001 }, () => note('C', 4, 1)).join('');
    const xml = score([part('P1', measure(attributes({ divisions: 1, beats: '4' }), notes))]);
    expect(parseMusicXml(xml)).toEqual({ ok: false, error: 'tooLarge' });
  });

  it('refuses a piece that lasts too long', () => {
    const xml = score([
      part('P1', measure(attributes({ divisions: 1, beats: '4' }), note('C', 4, 40_000_000))),
    ]);
    expect(parseMusicXml(xml)).toEqual({ ok: false, error: 'tooLarge' });
  });
});

describe('parseMusicXml: key signature and spelling', () => {
  const inKey = (fifths: number, ...content: string[]) =>
    parse(
      score([part('P1', measure(attributes({ divisions: 1, beats: '4', fifths }), ...content))]),
    );

  it('is C major when the file has no key', () => {
    expect(simple(note('C', 4, 4)).keySignatures).toEqual([{ tick: 0, fifths: 0 }]);
  });

  it('reads the key and keeps the spelling of the file', () => {
    const piece = inKey(
      -5,
      note('D', 4, 1, { alter: -1 }),
      note('E', 4, 1, { alter: 1 }),
      note('C', 4, 1),
      note('C', 4, 1, { alter: 1 }),
    );
    expect(piece.keySignatures).toEqual([{ tick: 0, fifths: -5 }]);
    expect(piece.notes.map((n) => [n.note, n.spelling])).toEqual([
      [61, { step: 1, alter: -1 }], // D♭4
      [65, { step: 2, alter: 1 }], // E♯4 sounds as F4
      [60, { step: 0, alter: 0 }],
      [61, { step: 0, alter: 1 }], // C♯4
    ]);
  });

  it('writes B♯3 and C♭4 in the pitch they sound', () => {
    const piece = inKey(0, note('B', 3, 2, { alter: 1 }), note('C', 4, 2, { alter: -1 }));
    expect(piece.notes.map((n) => [n.note, n.spelling])).toEqual([
      [60, { step: 6, alter: 1 }], // B♯3
      [59, { step: 0, alter: -1 }], // C♭4
    ]);
  });

  it('leaves a double sharp or flat without a spelling (the key writes it)', () => {
    const piece = inKey(0, note('F', 4, 2, { alter: 2 }), note('G', 4, 2, { alter: -2 }));
    expect(piece.notes.map((n) => [n.note, n.spelling])).toEqual([
      [67, undefined], // F𝄪4 sounds as G4
      [65, undefined], // G𝄫4 sounds as F4
    ]);
  });

  it('keeps a key change at its position, the first part winning at a tick', () => {
    const piece = parse(
      score([
        part(
          'P1',
          measure(attributes({ divisions: 1, beats: '4', fifths: 2 }), note('C', 4, 4)),
          measure(attributes({ fifths: -1 }), note('D', 4, 4)),
        ),
        part('P2', measure(attributes({ divisions: 1, fifths: 5 }), note('C', 3, 4))),
      ]),
    );
    expect(piece.keySignatures).toEqual([
      { tick: 0, fifths: 2 },
      { tick: 4, fifths: -1 },
    ]);
  });

  it('shifts a key change by the pickup padding, not the key at the start', () => {
    const piece = parse(
      score([
        part(
          'P1',
          measure(attributes({ divisions: 1, beats: '4', fifths: 1 }), note('G', 4, 1)),
          measure(attributes({ fifths: 2 }), note('C', 5, 4)),
        ),
      ]),
    );
    expect(piece.keySignatures).toEqual([
      { tick: 0, fifths: 1 },
      { tick: 4, fifths: 2 }, // measure 2 starts at tick 1, moved by the 3-tick pickup padding
    ]);
  });

  it('ignores a key outside −7 … 7', () => {
    expect(inKey(9, note('C', 4, 4)).keySignatures).toEqual([{ tick: 0, fifths: 0 }]);
  });

  it('moves the written step by the diatonic part of a transposition', () => {
    // A B♭ instrument: written C5 sounds B♭4 (−2 semitones, −1 step).
    const piece = parse(
      score([
        part(
          'P1',
          measure(
            attributes({ divisions: 1, beats: '4', transpose: -2, diatonic: -1 }),
            note('C', 5, 4),
          ),
        ),
      ]),
    );
    expect(piece.notes[0].note).toBe(70);
    expect(piece.notes[0].spelling).toEqual({ step: 6, alter: -1 }); // B♭
  });
});

describe('parseMusicXml: voices', () => {
  const voiced = (...content: string[]) =>
    parse(score([part('P1', measure(attributes({ divisions: 1, beats: '4' }), ...content))]));
  const voicesOf = (piece: Piece) => piece.notes.map((n) => [n.note, n.voice]);

  it('marks the lower of two voices on a staff and leaves the upper voice unmarked', () => {
    const piece = voiced(
      note('E', 5, 2, { voice: 1 }),
      note('D', 5, 2, { voice: 1 }),
      backup(4),
      note('C', 4, 4, { voice: 2 }),
    );
    expect(voicesOf(piece)).toEqual([
      [60, 2],
      [76, undefined],
      [74, undefined],
    ]);
  });

  it('ranks MuseScore voice numbers per staff (voices 5 and 6 on the second staff)', () => {
    const piece = parse(
      score([
        part(
          'P1',
          measure(
            attributes({ divisions: 1, beats: '4', staves: 2 }),
            note('E', 5, 4, { voice: 1, staff: 1 }),
            backup(4),
            note('G', 3, 4, { voice: 5, staff: 2 }),
            backup(4),
            note('C', 3, 4, { voice: 6, staff: 2 }),
          ),
        ),
      ]),
    );
    const byNote = Object.fromEntries(piece.notes.map((n) => [n.note, n.voice]));
    expect(byNote).toEqual({ 76: undefined, 55: undefined, 48: 2 });
  });

  it('joins a third voice to the voice with the closer average pitch', () => {
    const piece = voiced(
      note('C', 6, 4, { voice: 1 }),
      backup(4),
      note('C', 3, 4, { voice: 2 }),
      backup(4),
      note('D', 6, 4, { voice: 3 }), // near the upper voice
      backup(4),
      note('D', 3, 4, { voice: 4 }), // near the lower voice
    );
    const byNote = Object.fromEntries(piece.notes.map((n) => [n.note, n.voice]));
    expect(byNote).toEqual({ 84: undefined, 86: undefined, 48: 2, 50: 2 });
  });

  it('treats a note without a voice as the first voice', () => {
    const piece = voiced(note('E', 5, 4), backup(4), note('C', 4, 4, { voice: 2 }));
    expect(voicesOf(piece)).toEqual([
      [60, 2],
      [76, undefined],
    ]);
  });

  it('does not make a second part a voice of the first', () => {
    const piece = parse(
      score([
        part(
          'P1',
          measure(attributes({ divisions: 1, beats: '4' }), note('E', 5, 4, { voice: 1 })),
        ),
        part('P2', measure(attributes({ divisions: 1 }), note('C', 4, 4, { voice: 1 }))),
      ]),
    );
    expect(piece.notes.every((n) => n.voice === undefined)).toBe(true);
  });

  it('leaves a staff with one voice unmarked', () => {
    expect(voicesOf(voiced(note('E', 5, 4, { voice: 5 })))).toEqual([[76, undefined]]);
  });

  it('keeps a tie inside its voice', () => {
    const piece = voiced(
      note('C', 4, 2, { voice: 1, tie: 'start' }),
      note('C', 4, 2, { voice: 1, tie: 'stop' }),
      backup(4),
      note('C', 4, 4, { voice: 2 }),
    );
    expect(piece.notes.filter((n) => n.voice === undefined)).toHaveLength(1);
    expect(piece.notes.find((n) => n.voice === undefined)).toMatchObject({
      startTick: 0,
      endTick: 4,
    });
  });
});
