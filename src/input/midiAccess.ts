import { parseMidiMessage } from '../core/midi.ts';
import type { NoteBus } from './noteBus.ts';

export type MidiSupport = 'unsupported' | 'insecure' | 'available';

export type MidiStatus =
  | { state: 'connecting' }
  | { state: 'connected'; devices: string[] }
  | { state: 'no-devices' }
  | { state: 'denied' };

export function getMidiSupport(): MidiSupport {
  if (typeof navigator === 'undefined' || typeof navigator.requestMIDIAccess !== 'function') {
    return 'unsupported';
  }
  return window.isSecureContext ? 'available' : 'insecure';
}

interface InputState {
  notes: Set<number>;
  pedal: boolean;
}

/**
 * Asks for MIDI access (no SysEx) and feeds every connected input into the bus.
 * Follows hot-plug, and releases the notes of a device that disappears.
 * Returns a function that disconnects everything.
 */
export async function connectMidi(
  bus: NoteBus,
  onStatus: (status: MidiStatus) => void,
): Promise<() => void> {
  onStatus({ state: 'connecting' });

  let access: MIDIAccess;
  try {
    access = await navigator.requestMIDIAccess({ sysex: false });
  } catch {
    onStatus({ state: 'denied' });
    return () => {};
  }

  const attached = new Map<string, InputState>();

  function release(id: string) {
    const input = attached.get(id);
    if (!input) return;
    for (const note of input.notes) bus.emit({ type: 'noteoff', note, source: 'midi' });
    if (input.pedal) bus.emit({ type: 'sustain', on: false, source: 'midi' });
    attached.delete(id);
  }

  function attach(input: MIDIInput) {
    const state: InputState = { notes: new Set(), pedal: false };
    attached.set(input.id, state);
    input.onmidimessage = (message) => {
      const event = message.data ? parseMidiMessage(message.data) : null;
      if (!event) return;
      if (event.type === 'noteon') state.notes.add(event.note);
      else if (event.type === 'noteoff') state.notes.delete(event.note);
      else state.pedal = event.on;
      bus.emit(event);
    };
  }

  function refresh() {
    const connected = [...access.inputs.values()].filter((input) => input.state === 'connected');
    const ids = new Set(connected.map((input) => input.id));

    for (const id of [...attached.keys()]) {
      if (!ids.has(id)) release(id);
    }
    for (const input of connected) {
      if (!attached.has(input.id)) attach(input);
    }

    onStatus(
      connected.length > 0
        ? { state: 'connected', devices: connected.map((input) => input.name ?? input.id) }
        : { state: 'no-devices' },
    );
  }

  access.onstatechange = refresh;
  refresh();

  return () => {
    access.onstatechange = null;
    for (const input of access.inputs.values()) input.onmidimessage = null;
    for (const id of [...attached.keys()]) release(id);
  };
}
