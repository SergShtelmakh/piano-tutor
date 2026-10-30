import { describe, expect, it } from 'vitest';
import { MAX_FILE_BYTES, MAX_NOTES, parseMidiFile, tickToSeconds, type Piece } from './smf.ts';
import { chunk, ev, header, midiFile, track } from './smfTestHelpers.ts';

function parse(bytes: Uint8Array): Piece {
  const result = parseMidiFile(bytes);
  if (!result.ok) throw new Error(`expected a piece, got ${result.error}`);
  return result.piece;
}

describe('parseMidiFile: notes and timing', () => {
  it('reads a format-0 file with one note at 120 bpm', () => {
    const piece = parse(midiFile([track([ev.noteOn(0, 0, 60, 100), ev.noteOff(480, 0, 60)])]));
    expect(piece.ticksPerQuarter).toBe(480);
    expect(piece.notes).toEqual([
      { note: 60, startTick: 0, endTick: 480, start: 0, end: 0.5, velocity: 100 },
    ]);
    expect(piece.duration).toBeCloseTo(0.5);
  });

  it('merges the tracks of a format-1 file', () => {
    const right = track([ev.noteOn(0, 0, 72), ev.noteOff(480, 0, 72)]);
    const left = track([ev.noteOn(240, 1, 48), ev.noteOff(480, 1, 48)]);
    const piece = parse(midiFile([right, left]));
    expect(piece.notes.map((n) => [n.note, n.startTick])).toEqual([
      [72, 0],
      [48, 240],
    ]);
  });

  it('treats note-on with velocity 0 as note off', () => {
    const piece = parse(midiFile([track([ev.noteOn(0, 0, 60), ev.noteOnZero(100, 0, 60)])]));
    expect(piece.notes[0].endTick).toBe(100);
  });

  it('understands running status', () => {
    // The second event has no status byte: it is a note-on, the same as the first.
    const piece = parse(
      midiFile([track([ev.noteOn(0, 0, 60), ev.running(0, 64, 90), ev.noteOff(480, 0, 60)])]),
    );
    expect(piece.notes.map((n) => n.note).sort()).toEqual([60, 64]);
  });

  it('closes a note that is never released at the end of the track', () => {
    const piece = parse(
      midiFile([track([ev.noteOn(0, 0, 60), ev.text(960, 'end')], { end: false })]),
    );
    expect(piece.notes[0].endTick).toBe(960);
  });

  it('ends a retriggered note when the same key starts again', () => {
    const piece = parse(
      midiFile([track([ev.noteOn(0, 0, 60), ev.noteOn(240, 0, 60), ev.noteOff(240, 0, 60)])]),
    );
    expect(piece.notes.map((n) => [n.startTick, n.endTick])).toEqual([
      [0, 240],
      [240, 480],
    ]);
  });

  it('gives a note that ends at its own start a length of one tick', () => {
    const piece = parse(midiFile([track([ev.noteOn(0, 0, 60), ev.noteOff(0, 0, 60)])]));
    expect(piece.notes[0].endTick).toBe(1);
  });

  it('ignores percussion (channel 10) and fails with "empty" when nothing else is left', () => {
    const drums = track([ev.noteOn(0, 9, 36), ev.noteOff(100, 9, 36)]);
    expect(parseMidiFile(midiFile([drums]))).toEqual({ ok: false, error: 'empty' });

    const piece = parse(midiFile([drums, track([ev.noteOn(0, 0, 60), ev.noteOff(100, 0, 60)])]));
    expect(piece.notes.map((n) => n.note)).toEqual([60]);
  });

  it('skips SysEx, text, and unknown chunks', () => {
    const body = track([
      ev.text(0, 'piano'),
      ev.sysex(0, 1, 2, 3),
      ev.noteOn(0, 0, 60),
      ev.noteOff(10, 0, 60),
    ]);
    const bytes = Uint8Array.from([...header(0, 1, 480), ...chunk('XXXX', [1, 2, 3]), ...body]);
    expect(parse(bytes).notes).toHaveLength(1);
  });

  it('ignores a few trailing padding bytes', () => {
    const bytes = Uint8Array.from([
      ...midiFile([track([ev.noteOn(0, 0, 60), ev.noteOff(10, 0, 60)])]),
      0,
      0,
    ]);
    expect(parse(bytes).notes).toHaveLength(1);
  });
});

describe('parseMidiFile: tempo, time signature, pedal', () => {
  it('follows tempo changes when converting ticks to seconds', () => {
    // 480 ticks at 120 bpm (0.5 s), then 480 ticks at 60 bpm (1 s).
    const piece = parse(
      midiFile([
        track([
          ev.noteOn(0, 0, 60),
          ev.noteOff(480, 0, 60),
          ev.tempo(0, 1_000_000),
          ev.noteOn(0, 0, 62),
          ev.noteOff(480, 0, 62),
        ]),
      ]),
    );
    expect(piece.notes[0].end).toBeCloseTo(0.5);
    expect(piece.notes[1].start).toBeCloseTo(0.5);
    expect(piece.notes[1].end).toBeCloseTo(1.5);
    expect(piece.tempos).toHaveLength(2);
  });

  it('uses a tempo at tick 0 instead of the default', () => {
    const piece = parse(
      midiFile([track([ev.tempo(0, 1_000_000), ev.noteOn(0, 0, 60), ev.noteOff(480, 0, 60)])]),
    );
    expect(piece.tempos).toHaveLength(1);
    expect(piece.notes[0].end).toBeCloseTo(1);
  });

  it('collects tempo changes from several tracks', () => {
    const conductor = track([ev.tempo(480, 250_000)]);
    const music = track([ev.noteOn(0, 0, 60), ev.noteOff(960, 0, 60)]);
    const piece = parse(midiFile([conductor, music]));
    expect(piece.notes[0].end).toBeCloseTo(0.5 + 0.25); // 480 ticks at 120 bpm, 480 at 240 bpm
  });

  it('reads time signatures and defaults to 4/4 at tick 0', () => {
    const none = parse(midiFile([track([ev.noteOn(0, 0, 60), ev.noteOff(10, 0, 60)])]));
    expect(none.timeSignatures).toEqual([{ tick: 0, numerator: 4, denominator: 4 }]);

    const piece = parse(
      midiFile([
        track([
          ev.timeSignature(0, 3, 2),
          ev.noteOn(0, 0, 60),
          ev.timeSignature(1920, 6, 3),
          ev.noteOff(10, 0, 60),
        ]),
      ]),
    );
    expect(piece.timeSignatures).toEqual([
      { tick: 0, numerator: 3, denominator: 4 },
      { tick: 1920, numerator: 6, denominator: 8 },
    ]);
  });

  it('prepends 4/4 when the first time signature comes later', () => {
    const piece = parse(
      midiFile([track([ev.noteOn(0, 0, 60), ev.timeSignature(480, 3, 2), ev.noteOff(10, 0, 60)])]),
    );
    expect(piece.timeSignatures[0]).toEqual({ tick: 0, numerator: 4, denominator: 4 });
    expect(piece.timeSignatures).toHaveLength(2);
  });

  it('collects the sustain pedal in seconds', () => {
    const piece = parse(
      midiFile([
        track([
          ev.pedal(480, 0, 127),
          ev.noteOn(0, 0, 60),
          ev.pedal(480, 0, 0),
          ev.noteOff(0, 0, 60),
        ]),
      ]),
    );
    expect(piece.pedal.map((p) => [p.on, p.time])).toEqual([
      [true, 0.5],
      [false, 1],
    ]);
  });
});

describe('tickToSeconds', () => {
  it('is linear inside one tempo', () => {
    const tempos = [{ tick: 0, time: 0, microsPerQuarter: 500_000 }];
    expect(tickToSeconds(tempos, 96, 96)).toBeCloseTo(0.5);
    expect(tickToSeconds(tempos, 96, 192)).toBeCloseTo(1);
  });
});

describe('parseMidiFile: errors', () => {
  it('rejects data without an MThd header', () => {
    expect(parseMidiFile(Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8]))).toEqual({
      ok: false,
      error: 'notMidi',
    });
    expect(parseMidiFile(new TextEncoder().encode('hello world'))).toEqual({
      ok: false,
      error: 'notMidi',
    });
    expect(parseMidiFile(Uint8Array.from([0x4d, 0x54]))).toEqual({ ok: false, error: 'notMidi' });
  });

  it('reports an empty file as empty', () => {
    expect(parseMidiFile(new Uint8Array(0))).toEqual({ ok: false, error: 'empty' });
  });

  it('reports a file without notes as empty', () => {
    expect(parseMidiFile(midiFile([track([ev.tempo(0, 500_000)])]))).toEqual({
      ok: false,
      error: 'empty',
    });
  });

  it('rejects format 2 and SMPTE timing as unsupported', () => {
    const body = track([ev.noteOn(0, 0, 60), ev.noteOff(10, 0, 60)]);
    expect(parseMidiFile(Uint8Array.from([...header(2, 1, 480), ...body]))).toEqual({
      ok: false,
      error: 'unsupported',
    });
    expect(parseMidiFile(Uint8Array.from([...header(0, 1, 0xe728), ...body]))).toEqual({
      ok: false,
      error: 'unsupported',
    });
  });

  it('rejects a file over the size limit', () => {
    const big = new Uint8Array(MAX_FILE_BYTES + 1);
    big.set([0x4d, 0x54, 0x68, 0x64]);
    expect(parseMidiFile(big)).toEqual({ ok: false, error: 'tooLarge' });
  });

  it('rejects a file with too many notes', () => {
    const events = Array.from({ length: MAX_NOTES + 1 }, () => [
      ev.noteOn(1, 0, 60),
      ev.noteOff(1, 0, 60),
    ]).flat();
    expect(parseMidiFile(midiFile([track(events)]))).toEqual({ ok: false, error: 'tooLarge' });
  });

  it('rejects a piece that lasts hours', () => {
    const result = parseMidiFile(
      midiFile([
        track([ev.tempo(0, 0xffffff), ev.noteOn(0, 0, 60), ev.noteOff(0x0fffffff, 0, 60)]),
      ]),
    );
    expect(result).toEqual({ ok: false, error: 'tooLarge' });
  });

  it('reports truncated data as damaged', () => {
    const good = midiFile([track([ev.noteOn(0, 0, 60), ev.noteOff(480, 0, 60)])]);
    expect(parseMidiFile(good.subarray(0, 10))).toEqual({ ok: false, error: 'damaged' }); // inside the header
    expect(parseMidiFile(good.subarray(0, good.length - 4))).toEqual({
      ok: false,
      error: 'damaged',
    }); // the track is shorter than it says
  });

  it('reports a header without tracks as damaged', () => {
    expect(parseMidiFile(Uint8Array.from(header(0, 1, 480)))).toEqual({
      ok: false,
      error: 'damaged',
    });
  });

  it('reports a bad header length, running status with no status, and data bytes over 127', () => {
    expect(
      parseMidiFile(Uint8Array.from([...chunk('MThd', [0, 0, 0, 1]), ...track([ev.end()])])),
    ).toEqual({ ok: false, error: 'damaged' });
    expect(parseMidiFile(midiFile([track([ev.running(0, 60, 90)])]))).toEqual({
      ok: false,
      error: 'damaged',
    });
    expect(parseMidiFile(midiFile([track([[0, 0x90, 60, 200], ev.noteOff(10, 0, 60)])]))).toEqual({
      ok: false,
      error: 'damaged',
    });
  });

  it('reports zero ticks per quarter as damaged', () => {
    const body = track([ev.noteOn(0, 0, 60), ev.noteOff(10, 0, 60)]);
    expect(parseMidiFile(Uint8Array.from([...header(0, 1, 0), ...body]))).toEqual({
      ok: false,
      error: 'damaged',
    });
  });

  it('never throws on arbitrary bytes after a valid header', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const junk = Array.from({ length: 40 }, (_, i) => (seed * 31 + i * 17 + (i % 3) * 91) & 0xff);
      const bytes = Uint8Array.from([...header(1, 1, 480), ...chunk('MTrk', junk)]);
      expect(() => parseMidiFile(bytes)).not.toThrow();
    }
  });
});

describe('parseMidiFile: key signature', () => {
  const body = (...events: number[][]) =>
    midiFile([track([...events, ev.noteOn(0, 0, 60), ev.noteOff(480, 0, 60)])]);

  function keys(bytes: Uint8Array) {
    const result = parseMidiFile(bytes);
    if (!result.ok) throw new Error(`parse failed: ${result.error}`);
    return result.piece.keySignatures;
  }

  it('is C major when the file has no key signature', () => {
    expect(keys(body())).toEqual([{ tick: 0, fifths: 0 }]);
  });

  it('reads sharps and flats (a signed byte)', () => {
    expect(keys(body(ev.keySignature(0, 2)))).toEqual([{ tick: 0, fifths: 2 }]);
    expect(keys(body(ev.keySignature(0, -5)))).toEqual([{ tick: 0, fifths: -5 }]);
    expect(keys(body(ev.keySignature(0, -7, 1)))).toEqual([{ tick: 0, fifths: -7 }]);
  });

  it('keeps a change, and starts from C when the first key comes later', () => {
    expect(keys(body(ev.keySignature(480, -3), ev.keySignature(480, 1)))).toEqual([
      { tick: 0, fifths: 0 },
      { tick: 480, fifths: -3 },
      { tick: 960, fifths: 1 },
    ]);
  });

  it('lets a later key at the same tick replace the earlier one, and drops repeats', () => {
    expect(keys(body(ev.keySignature(0, 1), ev.keySignature(0, -2)))).toEqual([
      { tick: 0, fifths: -2 },
    ]);
    expect(keys(body(ev.keySignature(0, -2), ev.keySignature(480, -2)))).toEqual([
      { tick: 0, fifths: -2 },
    ]);
  });

  it('ignores a key outside −7 … 7', () => {
    expect(keys(body(ev.keySignature(0, 9)))).toEqual([{ tick: 0, fifths: 0 }]);
    expect(keys(body(ev.keySignature(0, -9)))).toEqual([{ tick: 0, fifths: 0 }]);
  });

  it('leaves MIDI notes without a spelling', () => {
    const result = parseMidiFile(body(ev.keySignature(0, -5)));
    expect(result.ok && result.piece.notes[0].spelling).toBeUndefined();
  });
});
