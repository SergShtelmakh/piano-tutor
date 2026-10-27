import { describe, expect, it } from 'vitest';
import { buildSchedule, drain, indexAtTime } from './playback.ts';
import type { Piece } from './smf.ts';

function piece(parts: Partial<Piece>): Piece {
  return {
    ticksPerQuarter: 480,
    notes: [],
    pedal: [],
    tempos: [{ tick: 0, time: 0, microsPerQuarter: 500_000 }],
    timeSignatures: [{ tick: 0, numerator: 4, denominator: 4 }],
    duration: 0,
    ...parts,
  };
}

const note = (n: number, start: number, end: number, velocity = 80) => ({
  note: n,
  startTick: 0,
  endTick: 0,
  start,
  end,
  velocity,
});

describe('buildSchedule', () => {
  it('turns notes and pedal changes into sorted events', () => {
    const schedule = buildSchedule(
      piece({
        notes: [note(60, 0, 1), note(64, 0.5, 1.5, 100)],
        pedal: [{ tick: 0, time: 0.25, on: true }],
      }),
    );
    expect(schedule).toEqual([
      { time: 0, type: 'noteon', note: 60, velocity: 80 },
      { time: 0.25, type: 'sustain', on: true },
      { time: 0.5, type: 'noteon', note: 64, velocity: 100 },
      { time: 1, type: 'noteoff', note: 60 },
      { time: 1.5, type: 'noteoff', note: 64 },
    ]);
  });

  it('ends a note before the same key starts again at the same time', () => {
    const schedule = buildSchedule(piece({ notes: [note(60, 0, 1), note(60, 1, 2)] }));
    expect(schedule.map((e) => `${e.time}:${e.type}`)).toEqual([
      '0:noteon',
      '1:noteoff',
      '1:noteon',
      '2:noteoff',
    ]);
  });

  it('puts the pedal between note-offs and note-ons at the same time', () => {
    const schedule = buildSchedule(
      piece({
        notes: [note(60, 0, 1), note(62, 1, 2)],
        pedal: [{ tick: 0, time: 1, on: false }],
      }),
    );
    expect(schedule.filter((e) => e.time === 1).map((e) => e.type)).toEqual([
      'noteoff',
      'sustain',
      'noteon',
    ]);
  });

  it('balances: every noteon has a later noteoff', () => {
    const schedule = buildSchedule(
      piece({ notes: [note(60, 0, 1), note(60, 0.5, 2), note(64, 1, 1.5)] }),
    );
    const open = new Map<number, number>();
    for (const e of schedule) {
      if (e.type === 'noteon') open.set(e.note, (open.get(e.note) ?? 0) + 1);
      if (e.type === 'noteoff') open.set(e.note, (open.get(e.note) ?? 0) - 1);
    }
    expect([...open.values()].every((count) => count === 0)).toBe(true);
  });
});

describe('indexAtTime and drain', () => {
  const schedule = buildSchedule(piece({ notes: [note(60, 0, 1), note(62, 1, 2)] }));

  it('finds the first event at or after a time', () => {
    expect(indexAtTime(schedule, 0)).toBe(0);
    expect(indexAtTime(schedule, 0.5)).toBe(1);
    expect(indexAtTime(schedule, 1)).toBe(1);
    expect(indexAtTime(schedule, 5)).toBe(schedule.length);
  });

  it('drains the events that are due, inclusive, and moves the index', () => {
    const first = drain(schedule, 0, 1);
    expect(first.events.map((e) => e.type)).toEqual(['noteon', 'noteoff', 'noteon']);
    expect(first.index).toBe(3);

    const rest = drain(schedule, first.index, 10);
    expect(rest.events).toHaveLength(1);
    expect(rest.index).toBe(schedule.length);
  });

  it('returns nothing when no event is due', () => {
    expect(drain(schedule, 1, 0.1)).toEqual({ events: [], index: 1 });
  });
});
