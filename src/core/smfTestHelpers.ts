// Test helper: builds Standard MIDI File bytes in code, so tests need no fixture files.

export function vlq(value: number): number[] {
  const bytes = [value & 0x7f];
  for (let rest = value >> 7; rest > 0; rest >>= 7) bytes.unshift((rest & 0x7f) | 0x80);
  return bytes;
}

/** One track event: its delta time, then the raw message bytes. */
export type TrackEvent = number[];

const event = (delta: number, ...message: number[]): TrackEvent => [...vlq(delta), ...message];

export const ev = {
  noteOn: (delta: number, channel: number, note: number, velocity = 90) =>
    event(delta, 0x90 | channel, note, velocity),
  noteOff: (delta: number, channel: number, note: number) => event(delta, 0x80 | channel, note, 0),
  /** A note-on with velocity 0, which means note off. */
  noteOnZero: (delta: number, channel: number, note: number) =>
    event(delta, 0x90 | channel, note, 0),
  /** Data bytes only: the status byte of the previous event is reused (running status). */
  running: (delta: number, ...data: number[]) => event(delta, ...data),
  pedal: (delta: number, channel: number, value: number) => event(delta, 0xb0 | channel, 64, value),
  tempo: (delta: number, microsPerQuarter: number) =>
    event(
      delta,
      0xff,
      0x51,
      3,
      (microsPerQuarter >> 16) & 0xff,
      (microsPerQuarter >> 8) & 0xff,
      microsPerQuarter & 0xff,
    ),
  /** `denominatorPower`: 2 means a quarter, 3 an eighth. */
  timeSignature: (delta: number, numerator: number, denominatorPower: number) =>
    event(delta, 0xff, 0x58, 4, numerator, denominatorPower, 24, 8),
  /** `fifths` is −7 … 7 (flats negative); `minor` is 0 for major, 1 for minor. */
  keySignature: (delta: number, fifths: number, minor = 0) =>
    event(delta, 0xff, 0x59, 2, fifths & 0xff, minor),
  sysex: (delta: number, ...data: number[]) => event(delta, 0xf0, ...vlq(data.length), ...data),
  text: (delta: number, text: string) =>
    event(delta, 0xff, 0x01, text.length, ...[...text].map((c) => c.charCodeAt(0))),
  end: (delta = 0) => event(delta, 0xff, 0x2f, 0),
};

const ascii = (tag: string) => [...tag].map((c) => c.charCodeAt(0));
const u16 = (n: number) => [(n >> 8) & 0xff, n & 0xff];
const u32 = (n: number) => [...u16(n >>> 16), ...u16(n & 0xffff)];

export function chunk(tag: string, body: number[]): number[] {
  return [...ascii(tag), ...u32(body.length), ...body];
}

/** A track chunk from events; the end-of-track event is added unless `end: false`. */
export function track(events: TrackEvent[], options: { end?: boolean } = {}): number[] {
  const all = options.end === false ? events : [...events, ev.end()];
  return chunk('MTrk', all.flat());
}

export function header(format: number, trackCount: number, division: number): number[] {
  return chunk('MThd', [...u16(format), ...u16(trackCount), ...u16(division)]);
}

/** A whole file: the header, then the given track chunks. */
export function midiFile(
  tracks: number[][],
  options: { format?: number; division?: number } = {},
): Uint8Array {
  const { format = tracks.length > 1 ? 1 : 0, division = 480 } = options;
  return Uint8Array.from([...header(format, tracks.length, division), ...tracks.flat()]);
}
