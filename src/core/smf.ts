// Pure: a small Standard MIDI File parser. Live Web MIDI messages are parsed in `midi.ts`.

export const MAX_FILE_BYTES = 2 * 1024 * 1024;
export const MAX_NOTES = 50_000;
/** A piece longer than this is refused, so the score has a bounded number of bars. */
export const MAX_DURATION_SECONDS = 4 * 3600;

const PERCUSSION_CHANNEL = 9; // channel 10, counted from 1
const DEFAULT_MICROS_PER_QUARTER = 500_000; // 120 bpm
const SUSTAIN_CONTROLLER = 64;

/** The hand a note is written for (a MusicXML staff), when the file says so. */
export type PieceHand = 'right' | 'left';

/** How a note is written: `step` 0–6 for C D E F G A B, and a flat, natural, or sharp. */
export interface NoteSpelling {
  step: number;
  alter: -1 | 0 | 1;
}

export interface KeySignature {
  tick: number;
  /** Sharps (positive) or flats (negative) in the key signature, −7 … 7; 0 is C major / A minor. */
  fifths: number;
}

export interface PieceNote {
  note: number;
  startTick: number;
  endTick: number;
  /** Seconds at the file's own tempo (100 %). */
  start: number;
  end: number;
  velocity: number;
  /** Set for notes of a two-staff MusicXML part; unset for MIDI (split at middle C). */
  hand?: PieceHand;
  /** The spelling written in a MusicXML file; unset for MIDI (spelled by the key signature). */
  spelling?: NoteSpelling;
  /**
   * 2 for the lower of two voices on a staff of a MusicXML part; unset for the only or the upper
   * voice, and for every MIDI note (a MIDI file has no voices).
   */
  voice?: 1 | 2;
}

export interface PedalChange {
  tick: number;
  time: number;
  on: boolean;
}

export interface TempoChange {
  tick: number;
  time: number;
  microsPerQuarter: number;
}

export interface TimeSignature {
  tick: number;
  numerator: number;
  denominator: number;
}

/** A parsed file: all tracks merged, percussion left out. */
export interface Piece {
  ticksPerQuarter: number;
  /** Sorted by start. */
  notes: readonly PieceNote[];
  pedal: readonly PedalChange[];
  tempos: readonly TempoChange[];
  /** Sorted; always starts at tick 0 (4/4 when the file says nothing). */
  timeSignatures: readonly TimeSignature[];
  /** Sorted; starts at tick 0 (C major when the file says nothing). Absent counts as C major. */
  keySignatures?: readonly KeySignature[];
  /** Seconds until the last note ends. */
  duration: number;
}

export type ParseError = 'notMidi' | 'unsupported' | 'empty' | 'tooLarge' | 'damaged';
export type ParseResult = { ok: true; piece: Piece } | { ok: false; error: ParseError };

/** Thrown inside the parser for data that ends early or makes no sense; never leaves this module. */
class DamagedError extends Error {}

class Reader {
  pos = 0;
  constructor(
    private readonly bytes: Uint8Array,
    readonly end: number = bytes.length,
  ) {}

  get done(): boolean {
    return this.pos >= this.end;
  }

  u8(): number {
    if (this.pos >= this.end) throw new DamagedError();
    return this.bytes[this.pos++];
  }

  u16(): number {
    return (this.u8() << 8) | this.u8();
  }

  u32(): number {
    return ((this.u8() << 24) | (this.u8() << 16) | (this.u8() << 8) | this.u8()) >>> 0;
  }

  /** A variable-length quantity: at most four bytes of seven bits. */
  vlq(): number {
    let value = 0;
    for (let i = 0; i < 4; i++) {
      const byte = this.u8();
      value = (value << 7) | (byte & 0x7f);
      if ((byte & 0x80) === 0) return value;
    }
    throw new DamagedError();
  }

  skip(length: number): void {
    if (length < 0 || this.pos + length > this.end) throw new DamagedError();
    this.pos += length;
  }

  bytesAt(length: number): Uint8Array {
    if (length < 0 || this.pos + length > this.end) throw new DamagedError();
    const slice = this.bytes.subarray(this.pos, this.pos + length);
    this.pos += length;
    return slice;
  }

  tag(): string {
    return String.fromCharCode(this.u8(), this.u8(), this.u8(), this.u8());
  }
}

interface RawNote {
  note: number;
  startTick: number;
  endTick: number;
  velocity: number;
}

interface RawTrack {
  notes: RawNote[];
  pedal: { tick: number; on: boolean }[];
  tempos: { tick: number; microsPerQuarter: number }[];
  timeSignatures: { tick: number; numerator: number; denominator: number }[];
  keySignatures: KeySignature[];
  lastTick: number;
}

function readTrack(reader: Reader): RawTrack {
  const track: RawTrack = {
    notes: [],
    pedal: [],
    tempos: [],
    timeSignatures: [],
    keySignatures: [],
    lastTick: 0,
  };
  const open = new Map<number, { startTick: number; velocity: number }>(); // channel * 128 + note
  let tick = 0;
  let status = 0;

  const close = (key: number, endTick: number) => {
    const started = open.get(key);
    if (!started) return;
    open.delete(key);
    track.notes.push({
      note: key % 128,
      startTick: started.startTick,
      endTick: Math.max(endTick, started.startTick + 1),
      velocity: started.velocity,
    });
  };

  while (!reader.done) {
    tick += reader.vlq();
    const first = reader.u8();

    if (first === 0xff) {
      const type = reader.u8();
      const data = reader.bytesAt(reader.vlq());
      if (type === 0x2f) break; // end of track
      if (type === 0x51 && data.length === 3) {
        const microsPerQuarter = (data[0] << 16) | (data[1] << 8) | data[2];
        if (microsPerQuarter > 0) track.tempos.push({ tick, microsPerQuarter });
      } else if (type === 0x59 && data.length >= 2) {
        const fifths = data[0] > 127 ? data[0] - 256 : data[0]; // a signed byte
        if (fifths >= -7 && fifths <= 7) track.keySignatures.push({ tick, fifths });
      } else if (type === 0x58 && data.length >= 2 && data[0] > 0) {
        track.timeSignatures.push({
          tick,
          numerator: data[0],
          denominator: 2 ** Math.min(data[1], 6),
        });
      }
      continue;
    }
    if (first === 0xf0 || first === 0xf7) {
      reader.skip(reader.vlq());
      continue;
    }

    let data1: number;
    if (first >= 0x80) {
      status = first;
      data1 = reader.u8();
    } else {
      if (status === 0) throw new DamagedError(); // running status without a previous status
      data1 = first;
    }
    if (data1 > 127 || status >= 0xf0) throw new DamagedError();

    const kind = status & 0xf0;
    const channel = status & 0x0f;
    const twoDataBytes = kind !== 0xc0 && kind !== 0xd0;
    const data2 = twoDataBytes ? reader.u8() : 0;
    if (data2 > 127) throw new DamagedError();
    if (channel === PERCUSSION_CHANNEL) continue;

    const key = channel * 128 + data1;
    if (kind === 0x90 && data2 > 0) {
      close(key, tick); // a retriggered note ends the previous one
      open.set(key, { startTick: tick, velocity: data2 });
    } else if (kind === 0x80 || kind === 0x90) {
      close(key, tick);
    } else if (kind === 0xb0 && data1 === SUSTAIN_CONTROLLER) {
      track.pedal.push({ tick, on: data2 >= 64 });
    }
  }

  track.lastTick = tick;
  for (const key of [...open.keys()]) close(key, tick);
  return track;
}

/** Seconds at 100 % for a tick, following the tempo map. */
export function tickToSeconds(
  tempos: readonly TempoChange[],
  ticksPerQuarter: number,
  tick: number,
): number {
  let low = 0;
  let high = tempos.length - 1;
  while (low < high) {
    const mid = (low + high + 1) >> 1;
    if (tempos[mid].tick <= tick) low = mid;
    else high = mid - 1;
  }
  const segment = tempos[low];
  return segment.time + ((tick - segment.tick) * segment.microsPerQuarter) / 1e6 / ticksPerQuarter;
}

function buildTempoMap(
  raw: readonly { tick: number; microsPerQuarter: number }[],
  ticksPerQuarter: number,
): TempoChange[] {
  const sorted = [...raw].sort((a, b) => a.tick - b.tick);
  const tempos: TempoChange[] = [
    { tick: 0, time: 0, microsPerQuarter: DEFAULT_MICROS_PER_QUARTER },
  ];
  for (const change of sorted) {
    const previous = tempos[tempos.length - 1];
    if (change.tick === previous.tick) {
      // A tempo at the same tick replaces the earlier one (the default included).
      previous.microsPerQuarter = change.microsPerQuarter;
      continue;
    }
    tempos.push({
      tick: change.tick,
      time: tickToSeconds(tempos, ticksPerQuarter, change.tick),
      microsPerQuarter: change.microsPerQuarter,
    });
  }
  return tempos;
}

function buildTimeSignatures(
  raw: readonly { tick: number; numerator: number; denominator: number }[],
): TimeSignature[] {
  const sorted = [...raw].sort((a, b) => a.tick - b.tick);
  if (sorted.length === 0 || sorted[0].tick > 0) {
    sorted.unshift({ tick: 0, numerator: 4, denominator: 4 });
  }
  return sorted;
}

/** Key signatures sorted by tick, starting at tick 0 (C major); a later one at a tick wins. */
export function buildKeySignatures(raw: readonly KeySignature[]): KeySignature[] {
  const result: KeySignature[] = [{ tick: 0, fifths: 0 }];
  for (const key of [...raw].sort((a, b) => a.tick - b.tick)) {
    const last = result[result.length - 1];
    if (key.tick === last.tick) last.fifths = key.fifths;
    else if (key.fifths !== last.fifths) result.push({ ...key });
  }
  return result;
}

function parseUnchecked(bytes: Uint8Array): ParseResult {
  const reader = new Reader(bytes);
  if (bytes.length < 4 || reader.tag() !== 'MThd') return { ok: false, error: 'notMidi' };

  const headerLength = reader.u32();
  if (headerLength < 6) throw new DamagedError();
  const format = reader.u16();
  reader.u16(); // declared track count; the chunks themselves are authoritative
  const division = reader.u16();
  reader.skip(headerLength - 6);

  if (format > 1 || (division & 0x8000) !== 0) return { ok: false, error: 'unsupported' };
  const ticksPerQuarter = division;
  if (ticksPerQuarter === 0) throw new DamagedError();

  const tracks: RawTrack[] = [];
  // Fewer than eight bytes left is trailing padding, not a chunk.
  while (reader.end - reader.pos >= 8) {
    const id = reader.tag();
    const length = reader.u32();
    if (id === 'MTrk') {
      const body = reader.bytesAt(length);
      tracks.push(readTrack(new Reader(body)));
    } else {
      reader.skip(length); // unknown chunks are skipped, as the format asks
    }
  }
  if (tracks.length === 0) throw new DamagedError();

  const rawNotes = tracks.flatMap((track) => track.notes);
  if (rawNotes.length === 0) return { ok: false, error: 'empty' };
  if (rawNotes.length > MAX_NOTES) return { ok: false, error: 'tooLarge' };

  const tempos = buildTempoMap(
    tracks.flatMap((track) => track.tempos),
    ticksPerQuarter,
  );
  const seconds = (tick: number) => tickToSeconds(tempos, ticksPerQuarter, tick);

  const notes: PieceNote[] = rawNotes
    .sort((a, b) => a.startTick - b.startTick || a.note - b.note)
    .map((raw) => ({
      ...raw,
      start: seconds(raw.startTick),
      end: seconds(raw.endTick),
    }));
  const duration = Math.max(...notes.map((note) => note.end));
  if (duration > MAX_DURATION_SECONDS) return { ok: false, error: 'tooLarge' };

  const pedal: PedalChange[] = tracks
    .flatMap((track) => track.pedal)
    .sort((a, b) => a.tick - b.tick)
    .map((change) => ({ ...change, time: seconds(change.tick) }));

  return {
    ok: true,
    piece: {
      ticksPerQuarter,
      notes,
      pedal,
      tempos,
      timeSignatures: buildTimeSignatures(tracks.flatMap((track) => track.timeSignatures)),
      keySignatures: buildKeySignatures(tracks.flatMap((track) => track.keySignatures)),
      duration,
    },
  };
}

/** Parses a Standard MIDI File (format 0 or 1). Never throws. */
export function parseMidiFile(bytes: Uint8Array): ParseResult {
  if (bytes.length === 0) return { ok: false, error: 'empty' };
  if (bytes.length > MAX_FILE_BYTES) return { ok: false, error: 'tooLarge' };
  try {
    return parseUnchecked(bytes);
  } catch (error) {
    if (error instanceof DamagedError) return { ok: false, error: 'damaged' };
    throw error;
  }
}
