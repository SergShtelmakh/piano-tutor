import type { NoteEvent, NoteSource } from './types.ts';

/**
 * Bookkeeping for which notes are held, sounding, and sustained by the pedal.
 * Used by the on-screen highlight (`held`) and by the synth (actions).
 */
export interface HeldState {
  /** Notes physically held, with every source that holds each one. */
  readonly held: ReadonlyMap<number, ReadonlySet<NoteSource>>;
  /** Notes that have been released but keep ringing because the pedal is down. */
  readonly sustained: ReadonlySet<number>;
  /** Notes the synth is currently playing. */
  readonly sounding: ReadonlySet<number>;
  readonly pedal: boolean;
}

export type SynthAction =
  { type: 'start'; note: number; velocity: number } | { type: 'stop'; note: number };

export interface ApplyResult {
  state: HeldState;
  actions: SynthAction[];
}

export function createHeldState(): HeldState {
  return { held: new Map(), sustained: new Set(), sounding: new Set(), pedal: false };
}

export function isHeld(state: HeldState, note: number): boolean {
  return state.held.has(note);
}

export function apply(state: HeldState, event: NoteEvent): ApplyResult {
  switch (event.type) {
    case 'noteon':
      return noteOn(state, event.note, event.velocity, event.source);
    case 'noteoff':
      return noteOff(state, event.note, event.source);
    case 'sustain':
      return setPedal(state, event.on);
  }
}

function noteOn(state: HeldState, note: number, velocity: number, source: NoteSource): ApplyResult {
  const held = new Map(state.held);
  held.set(note, new Set(state.held.get(note)).add(source));
  const sustained = new Set(state.sustained);
  sustained.delete(note);
  const sounding = new Set(state.sounding).add(note);

  const actions: SynthAction[] = [];
  if (state.sounding.has(note)) actions.push({ type: 'stop', note });
  actions.push({ type: 'start', note, velocity });
  return { state: { ...state, held, sustained, sounding }, actions };
}

function noteOff(state: HeldState, note: number, source: NoteSource): ApplyResult {
  const holders = state.held.get(note);
  if (!holders?.has(source)) return { state, actions: [] };

  const remaining = new Set(holders);
  remaining.delete(source);
  const held = new Map(state.held);
  if (remaining.size > 0) {
    held.set(note, remaining);
    return { state: { ...state, held }, actions: [] };
  }
  held.delete(note);

  if (state.pedal) {
    return {
      state: { ...state, held, sustained: new Set(state.sustained).add(note) },
      actions: [],
    };
  }
  const sounding = new Set(state.sounding);
  sounding.delete(note);
  return { state: { ...state, held, sounding }, actions: [{ type: 'stop', note }] };
}

function setPedal(state: HeldState, on: boolean): ApplyResult {
  if (on === state.pedal) return { state, actions: [] };
  if (on) return { state: { ...state, pedal: true }, actions: [] };

  const sounding = new Set(state.sounding);
  const actions: SynthAction[] = [];
  for (const note of state.sustained) {
    if (!state.held.has(note)) {
      sounding.delete(note);
      actions.push({ type: 'stop', note });
    }
  }
  return { state: { ...state, pedal: false, sustained: new Set(), sounding }, actions };
}

/** Note-off events for every note the given source still holds (window blur, device unplugged). */
export function releaseSource(state: HeldState, source: NoteSource): NoteEvent[] {
  const events: NoteEvent[] = [];
  for (const [note, holders] of state.held) {
    if (holders.has(source)) events.push({ type: 'noteoff', note, source });
  }
  return events;
}
