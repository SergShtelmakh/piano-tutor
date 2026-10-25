import type { NoteEvent } from './types.ts';

const NOTE_OFF = 0x80;
const NOTE_ON = 0x90;
const CONTROL_CHANGE = 0xb0;
const SUSTAIN_CONTROLLER = 64;

/**
 * Turns one raw MIDI message into a note event, or null for anything we ignore
 * (other controllers, pitch bend, clock, SysEx, short or malformed messages).
 * All channels are accepted.
 */
export function parseMidiMessage(data: ArrayLike<number>): NoteEvent | null {
  if (data.length < 3) return null;
  const [status, data1, data2] = [data[0], data[1], data[2]];
  if (data1 > 127 || data2 > 127) return null;

  switch (status & 0xf0) {
    case NOTE_ON:
      return data2 > 0
        ? { type: 'noteon', note: data1, velocity: data2, source: 'midi' }
        : { type: 'noteoff', note: data1, source: 'midi' };
    case NOTE_OFF:
      return { type: 'noteoff', note: data1, source: 'midi' };
    case CONTROL_CHANGE:
      return data1 === SUSTAIN_CONTROLLER
        ? { type: 'sustain', on: data2 >= 64, source: 'midi' }
        : null;
    default:
      return null;
  }
}
