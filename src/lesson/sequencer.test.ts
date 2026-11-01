import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NoteEvent } from '../core/types.ts';
import { createNoteBus } from '../input/noteBus.ts';
import { createSequencer } from './sequencer.ts';

function setup() {
  const bus = createNoteBus();
  const events: NoteEvent[] = [];
  bus.subscribe((event) => events.push(event));
  return { bus, events, sequencer: createSequencer(bus) };
}

const brief = (events: NoteEvent[]) =>
  events.map((event) =>
    event.type === 'sustain' ? 'sustain' : `${event.type}:${event.note}:${event.source}`,
  );

describe('createSequencer', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('plays each chunk at its time as playback notes and releases it after the hold', () => {
    const { sequencer, events } = setup();
    sequencer.schedule(
      [
        { notes: [60, 64], at: 0 },
        { notes: [62], at: 0.5 },
      ],
      0.3,
    );
    expect(sequencer.busy()).toBe(true);
    vi.advanceTimersByTime(0);
    expect(brief(events)).toEqual(['noteon:60:playback', 'noteon:64:playback']);
    vi.advanceTimersByTime(300);
    expect(brief(events).slice(2)).toEqual(['noteoff:60:playback', 'noteoff:64:playback']);
    vi.advanceTimersByTime(200);
    expect(brief(events).slice(4)).toEqual(['noteon:62:playback']);
    vi.advanceTimersByTime(300);
    expect(brief(events).slice(5)).toEqual(['noteoff:62:playback']);
    expect(sequencer.busy()).toBe(false);
  });

  it('gives every noteon a noteoff, also when the hold is shorter than the next chunk', () => {
    const { sequencer, events } = setup();
    sequencer.schedule(
      [
        { notes: [60], at: 0 },
        { notes: [60], at: 0.05 },
      ],
      0.5,
    );
    vi.advanceTimersByTime(5000);
    const on = events.filter((event) => event.type === 'noteon').length;
    const off = events.filter((event) => event.type === 'noteoff').length;
    expect(on).toBe(2);
    expect(off).toBe(2);
  });

  it('stop cancels what is waiting and releases what sounds', () => {
    const { sequencer, events } = setup();
    sequencer.schedule(
      [
        { notes: [60], at: 0 },
        { notes: [62], at: 1 },
      ],
      5,
    );
    vi.advanceTimersByTime(100);
    sequencer.stop();
    expect(brief(events)).toEqual(['noteon:60:playback', 'noteoff:60:playback']);
    expect(sequencer.busy()).toBe(false);
    vi.advanceTimersByTime(10_000);
    expect(events).toHaveLength(2);
  });

  it('tells its listeners when it starts and stops being busy', () => {
    const { sequencer } = setup();
    const changes: boolean[] = [];
    const unsubscribe = sequencer.subscribe(() => changes.push(sequencer.busy()));
    sequencer.schedule([{ notes: [60], at: 0.1 }], 0.1);
    vi.advanceTimersByTime(1000);
    expect(changes).toEqual([true, false]);
    unsubscribe();
    sequencer.schedule([{ notes: [60], at: 0 }], 0.1);
    expect(changes).toHaveLength(2);
  });

  it('stop on an idle sequencer does nothing', () => {
    const { sequencer, events } = setup();
    sequencer.stop();
    expect(events).toEqual([]);
  });
});
