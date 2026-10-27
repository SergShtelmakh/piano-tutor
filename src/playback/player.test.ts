import { describe, expect, it } from 'vitest';
import type { NoteEvent } from '../core/types.ts';
import type { Piece } from '../core/smf.ts';
import { createNoteBus } from '../input/noteBus.ts';
import { createPlayer, type Clock } from './player.ts';

class FakeClock implements Clock {
  time = 0;
  private callback: (() => void) | null = null;
  private every = 0;
  private nextAt = 0;

  now() {
    return this.time;
  }
  setInterval(callback: () => void, ms: number) {
    this.callback = callback;
    this.every = ms;
    this.nextAt = this.time + ms;
    return 1;
  }
  clearInterval() {
    this.callback = null;
  }
  /** Moves time forward in steps of one interval, running the callback at each step. */
  advance(ms: number) {
    const end = this.time + ms;
    while (this.callback && this.nextAt <= end) {
      this.time = this.nextAt;
      this.nextAt += this.every;
      this.callback();
    }
    this.time = end;
  }
}

function piece(notes: [note: number, start: number, end: number][], pedal = false): Piece {
  return {
    ticksPerQuarter: 480,
    notes: notes.map(([note, start, end]) => ({
      note,
      startTick: 0,
      endTick: 0,
      start,
      end,
      velocity: 70,
    })),
    pedal: pedal
      ? [
          { tick: 0, time: 0.5, on: true },
          { tick: 0, time: 3, on: false },
        ]
      : [],
    tempos: [{ tick: 0, time: 0, microsPerQuarter: 500_000 }],
    timeSignatures: [{ tick: 0, numerator: 4, denominator: 4 }],
    duration: Math.max(...notes.map((n) => n[2])),
  };
}

function setup(
  p: Piece = piece([
    [60, 0, 1],
    [64, 1, 2],
    [67, 1, 3],
  ]),
) {
  const clock = new FakeClock();
  const bus = createNoteBus();
  const events: NoteEvent[] = [];
  bus.subscribe((event) => events.push(event));
  const player = createPlayer(bus, clock);
  player.load(p);
  events.length = 0;
  return { clock, player, events };
}

const kinds = (events: NoteEvent[]) =>
  events.map((e) => (e.type === 'sustain' ? `sustain:${e.on}` : `${e.type}:${e.note}`));

/** Notes that were started and not stopped. */
function stillOn(events: NoteEvent[]) {
  const on = new Set<number>();
  for (const e of events) {
    if (e.type === 'noteon') on.add(e.note);
    if (e.type === 'noteoff') on.delete(e.note);
  }
  return [...on];
}

describe('player', () => {
  it('emits events at their times with source "playback"', () => {
    const { clock, player, events } = setup();
    player.play();
    clock.advance(20);
    expect(events).toEqual([{ type: 'noteon', note: 60, velocity: 70, source: 'playback' }]);

    clock.advance(980);
    expect(kinds(events)).toEqual(['noteon:60', 'noteoff:60', 'noteon:64', 'noteon:67']);
    expect(events.every((e) => e.source === 'playback')).toBe(true);
  });

  it('emits each event within one tick of its time', () => {
    const { clock, player, events } = setup(piece([[60, 0.5, 1]]));
    player.play();
    clock.advance(495);
    expect(events).toHaveLength(0);
    clock.advance(15);
    expect(kinds(events)).toEqual(['noteon:60']);
  });

  it('does not drift over a long piece', () => {
    const long = piece([[60, 599.99, 601]]);
    const { clock, player, events } = setup(long);
    player.play();
    clock.advance(599_980);
    expect(events).toHaveLength(0);
    clock.advance(30);
    expect(kinds(events)).toEqual(['noteon:60']);
  });

  it('pauses: releases the notes and keeps the position', () => {
    const { clock, player, events } = setup();
    player.play();
    clock.advance(1500);
    player.pause();
    expect(stillOn(events)).toEqual([]);
    expect(player.getState().playing).toBe(false);
    expect(player.getState().position).toBeCloseTo(1.5, 1);

    events.length = 0;
    clock.advance(5000);
    expect(events).toHaveLength(0); // nothing plays while paused
    expect(player.positionNow()).toBeCloseTo(1.5, 1);
  });

  it('resumes from where it paused', () => {
    const { clock, player, events } = setup(
      piece([
        [60, 0, 1],
        [62, 2, 3],
      ]),
    );
    player.play();
    clock.advance(1500);
    player.pause();
    events.length = 0;
    player.play();
    clock.advance(400);
    expect(events).toHaveLength(0);
    clock.advance(200);
    expect(kinds(events)).toEqual(['noteon:62']);
  });

  it('stops: releases the notes and goes back to the start', () => {
    const { clock, player, events } = setup();
    player.play();
    clock.advance(1500);
    player.stop();
    expect(stillOn(events)).toEqual([]);
    expect(player.getState()).toMatchObject({ playing: false, position: 0 });
  });

  it('ends: plays the last events, releases everything, and returns to the start', () => {
    const { clock, player, events } = setup();
    player.play();
    clock.advance(3500);
    expect(stillOn(events)).toEqual([]);
    expect(kinds(events)).toContain('noteoff:67');
    expect(player.getState()).toMatchObject({ playing: false, position: 0 });
    expect(player.getState().sounding.size).toBe(0);
  });

  it('can be played again after the end', () => {
    const { clock, player, events } = setup();
    player.play();
    clock.advance(3500);
    events.length = 0;
    player.play();
    clock.advance(20);
    expect(kinds(events)).toEqual(['noteon:60']);
  });

  it('seeks while playing: releases the notes and continues from the new place', () => {
    const { clock, player, events } = setup();
    player.play();
    clock.advance(1500);
    events.length = 0;
    player.seek(0.2);
    expect(stillOn(events)).toEqual([]);
    expect(kinds(events)).toEqual(['noteoff:64', 'noteoff:67']);
    events.length = 0;
    clock.advance(900); // 0.2 s + 0.9 s: past the start of 64 and 67 at 1 s
    // The note that was already sounding before the seek is not started, so it has no end either.
    expect(kinds(events)).toEqual(['noteon:64', 'noteon:67']);
  });

  it('seeks while paused and stays paused', () => {
    const { clock, player, events } = setup(
      piece([
        [60, 0, 1],
        [64, 1, 2],
        [67, 2.5, 3],
      ]),
    );
    player.seek(1.5);
    expect(player.getState()).toMatchObject({ playing: false, position: 1.5 });
    clock.advance(1000);
    expect(events).toHaveLength(0);
    player.play();
    clock.advance(20);
    // Playing from 1.5 s: a note that started before the seek is not started.
    expect(events).toHaveLength(0);
    clock.advance(1000);
    expect(kinds(events)).toEqual(['noteon:67']);
  });

  it('clamps a seek into the piece', () => {
    const { player } = setup();
    player.seek(-5);
    expect(player.getState().position).toBe(0);
    player.seek(99);
    expect(player.getState().position).toBe(3);
  });

  it('changes the tempo while playing and keeps the position', () => {
    const { clock, player, events } = setup(
      piece([
        [60, 0, 1],
        [62, 2, 3],
      ]),
    );
    player.play();
    clock.advance(1000);
    player.setRate(1.5);
    expect(player.positionNow()).toBeCloseTo(1, 1);
    events.length = 0;
    clock.advance(660); // 1 s + 0.66 s * 1.5 = 1.99 s
    expect(events).toHaveLength(1 - 1);
    clock.advance(40);
    expect(kinds(events)).toEqual(['noteon:62']);
  });

  it('clamps the tempo to 50–150 %', () => {
    const { player } = setup();
    player.setRate(9);
    expect(player.getState().rate).toBe(1.5);
    player.setRate(0.01);
    expect(player.getState().rate).toBe(0.5);
  });

  it('plays the sustain pedal and lifts it on pause', () => {
    const { clock, player, events } = setup(
      piece(
        [
          [60, 0, 1],
          [62, 1, 4],
        ],
        true,
      ),
    );
    player.play();
    clock.advance(700);
    expect(kinds(events)).toContain('sustain:true');
    events.length = 0;
    player.pause();
    expect(kinds(events)).toContain('sustain:false');
  });

  it('reports the notes it holds', () => {
    const { clock, player } = setup();
    player.play();
    clock.advance(1500);
    expect([...player.getState().sounding].sort()).toEqual([64, 67]);
  });

  it('retriggers a note that starts when the same key ends', () => {
    const { clock, player, events } = setup(
      piece([
        [60, 0, 1],
        [60, 1, 2],
      ]),
    );
    player.play();
    clock.advance(1100);
    expect(kinds(events)).toEqual(['noteon:60', 'noteoff:60', 'noteon:60']);
  });

  it('loading another piece silences the old one', () => {
    const { clock, player, events } = setup();
    player.play();
    clock.advance(1500);
    player.load(piece([[72, 0, 1]]));
    expect(stillOn(events)).toEqual([]);
    expect(player.getState()).toMatchObject({ playing: false, position: 0, duration: 1 });
  });

  it('dispose silences everything and stops the clock', () => {
    const { clock, player, events } = setup();
    player.play();
    clock.advance(1500);
    player.dispose();
    expect(stillOn(events)).toEqual([]);
    events.length = 0;
    clock.advance(5000);
    expect(events).toHaveLength(0);
  });

  it('ignores play with nothing loaded', () => {
    const clock = new FakeClock();
    const player = createPlayer(createNoteBus(), clock);
    player.play();
    expect(player.getState().playing).toBe(false);
  });

  it('leaves no note on after any mix of operations', () => {
    const { clock, player, events } = setup(
      piece(
        [
          [60, 0, 2],
          [62, 0.5, 2.5],
          [64, 1, 3],
          [60, 1.5, 2],
          [65, 2, 3.5],
        ],
        true,
      ),
    );
    const steps: (() => void)[] = [
      () => player.play(),
      () => clock.advance(700),
      () => player.seek(1.2),
      () => clock.advance(900),
      () => player.setRate(0.5),
      () => clock.advance(1300),
      () => player.pause(),
      () => player.play(),
      () => clock.advance(5000),
    ];
    for (const step of steps) step();
    player.stop();
    expect(stillOn(events)).toEqual([]);
  });

  it('notifies subscribers on changes', () => {
    const { clock, player } = setup();
    let calls = 0;
    const unsubscribe = player.subscribe(() => calls++);
    player.play();
    clock.advance(1100);
    expect(calls).toBeGreaterThan(1);
    const before = calls;
    unsubscribe();
    clock.advance(500);
    expect(calls).toBe(before);
  });

  it('hands out the same state object until something changes', () => {
    const { player } = setup();
    expect(player.getState()).toBe(player.getState());
  });
});
