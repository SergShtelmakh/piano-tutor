import { describe, expect, it } from 'vitest';
import {
  apply,
  createHeldState,
  isHeld,
  releaseSource,
  type HeldState,
  type SynthAction,
} from './heldNotes.ts';
import type { NoteEvent } from './types.ts';

const on = (note: number, source: NoteEvent['source'] = 'computer', velocity = 100): NoteEvent => ({
  type: 'noteon',
  note,
  velocity,
  source,
});
const off = (note: number, source: NoteEvent['source'] = 'computer'): NoteEvent => ({
  type: 'noteoff',
  note,
  source,
});
const pedal = (value: boolean): NoteEvent => ({ type: 'sustain', on: value, source: 'midi' });

function run(events: NoteEvent[]): { state: HeldState; actions: SynthAction[] } {
  let state = createHeldState();
  const actions: SynthAction[] = [];
  for (const event of events) {
    const result = apply(state, event);
    state = result.state;
    actions.push(...result.actions);
  }
  return { state, actions };
}

describe('heldNotes', () => {
  it('starts and stops a note', () => {
    const { state, actions } = run([on(60), off(60)]);
    expect(actions).toEqual([
      { type: 'start', note: 60, velocity: 100 },
      { type: 'stop', note: 60 },
    ]);
    expect(isHeld(state, 60)).toBe(false);
    expect(state.sounding.size).toBe(0);
  });

  it('keeps a note held while any source holds it', () => {
    const { state, actions } = run([on(60, 'computer'), on(60, 'screen'), off(60, 'computer')]);
    expect(isHeld(state, 60)).toBe(true);
    expect(actions.some((a) => a.type === 'stop' && a.note === 60)).toBe(true); // the restart stop only
    const after = apply(state, off(60, 'screen'));
    expect(isHeld(after.state, 60)).toBe(false);
    expect(after.actions).toEqual([{ type: 'stop', note: 60 }]);
  });

  it('restarts a note that is already sounding', () => {
    const { actions } = run([on(60), on(60)]);
    expect(actions).toEqual([
      { type: 'start', note: 60, velocity: 100 },
      { type: 'stop', note: 60 },
      { type: 'start', note: 60, velocity: 100 },
    ]);
  });

  it('ignores a note off from a source that does not hold the note', () => {
    const { state, actions } = run([on(60, 'computer'), off(60, 'screen')]);
    expect(actions).toHaveLength(1);
    expect(isHeld(state, 60)).toBe(true);
  });

  it('keeps released notes sounding while the pedal is down, but not lit', () => {
    const { state, actions } = run([pedal(true), on(60), off(60)]);
    expect(actions).toEqual([{ type: 'start', note: 60, velocity: 100 }]);
    expect(isHeld(state, 60)).toBe(false);
    expect(state.sounding.has(60)).toBe(true);
  });

  it('stops sustained notes when the pedal goes up', () => {
    const { state, actions } = run([pedal(true), on(60), on(64), off(60), off(64), pedal(false)]);
    expect(actions.filter((a) => a.type === 'stop').map((a) => a.note)).toEqual([60, 64]);
    expect(state.sounding.size).toBe(0);
  });

  it('keeps notes that are still held when the pedal goes up', () => {
    const { state, actions } = run([pedal(true), on(60), on(64), off(60), pedal(false)]);
    expect(actions.filter((a) => a.type === 'stop').map((a) => a.note)).toEqual([60]);
    expect(state.sounding.has(64)).toBe(true);
  });

  it('a note pressed again during sustain is no longer sustained', () => {
    const { actions } = run([pedal(true), on(60), off(60), on(60), pedal(false)]);
    expect(actions.filter((a) => a.type === 'stop')).toEqual([{ type: 'stop', note: 60 }]); // restart only
    // after pedal up the held note must not be stopped
    const result = run([pedal(true), on(60), off(60), on(60), pedal(false)]);
    expect(result.state.sounding.has(60)).toBe(true);
  });

  it('releases every note held by one source', () => {
    const { state } = run([on(60, 'midi'), on(62, 'midi'), on(64, 'computer')]);
    const events = releaseSource(state, 'midi');
    expect(events).toEqual([off(60, 'midi'), off(62, 'midi')]);
    expect(releaseSource(state, 'screen')).toEqual([]);
  });
});
