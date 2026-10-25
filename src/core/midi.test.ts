import { describe, expect, it } from 'vitest';
import { parseMidiMessage } from './midi.ts';

describe('parseMidiMessage', () => {
  it('parses note on', () => {
    expect(parseMidiMessage([0x90, 60, 100])).toEqual({
      type: 'noteon',
      note: 60,
      velocity: 100,
      source: 'midi',
    });
  });

  it('parses note off', () => {
    expect(parseMidiMessage([0x80, 60, 40])).toEqual({ type: 'noteoff', note: 60, source: 'midi' });
  });

  it('treats note on with velocity 0 as note off', () => {
    expect(parseMidiMessage([0x90, 60, 0])).toEqual({ type: 'noteoff', note: 60, source: 'midi' });
  });

  it('accepts every channel', () => {
    for (let channel = 0; channel < 16; channel++) {
      expect(parseMidiMessage([0x90 | channel, 64, 90])?.type).toBe('noteon');
      expect(parseMidiMessage([0x80 | channel, 64, 0])?.type).toBe('noteoff');
    }
  });

  it('parses the sustain pedal around the 63/64 boundary', () => {
    expect(parseMidiMessage([0xb0, 64, 63])).toEqual({
      type: 'sustain',
      on: false,
      source: 'midi',
    });
    expect(parseMidiMessage([0xb0, 64, 64])).toEqual({ type: 'sustain', on: true, source: 'midi' });
    expect(parseMidiMessage([0xb0, 64, 127])).toEqual({
      type: 'sustain',
      on: true,
      source: 'midi',
    });
    expect(parseMidiMessage([0xb0, 64, 0])).toEqual({ type: 'sustain', on: false, source: 'midi' });
  });

  it('ignores other controllers, pitch bend, clock, SysEx and aftertouch', () => {
    expect(parseMidiMessage([0xb0, 1, 100])).toBeNull();
    expect(parseMidiMessage([0xe0, 0, 64])).toBeNull();
    expect(parseMidiMessage([0xf8])).toBeNull();
    expect(parseMidiMessage([0xfe])).toBeNull();
    expect(parseMidiMessage([0xf0, 0x7e, 0x7f, 0xf7])).toBeNull();
    expect(parseMidiMessage([0xa0, 60, 50])).toBeNull();
  });

  it('ignores empty, short and malformed messages', () => {
    expect(parseMidiMessage([])).toBeNull();
    expect(parseMidiMessage([0x90])).toBeNull();
    expect(parseMidiMessage([0x90, 60])).toBeNull();
    expect(parseMidiMessage([0x90, 200, 100])).toBeNull();
    expect(parseMidiMessage(new Uint8Array([0x90, 60, 100]))?.type).toBe('noteon');
  });
});
