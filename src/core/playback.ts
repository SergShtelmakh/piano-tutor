// Pure: the time-ordered events of a piece, and how to walk through them. The clock and the
// note bus live in `playback/player.ts`.
import type { Piece } from './smf.ts';

export type ScheduleEvent =
  | { time: number; type: 'noteon'; note: number; velocity: number }
  | { time: number; type: 'noteoff'; note: number }
  | { time: number; type: 'sustain'; on: boolean };

/** At the same time: notes end first (so a repeated note retriggers), then the pedal, then notes start. */
const ORDER = { noteoff: 0, sustain: 1, noteon: 2 } as const;

/** Every event of a piece, sorted by time (seconds at 100 % tempo). */
export function buildSchedule(piece: Piece): ScheduleEvent[] {
  const events: ScheduleEvent[] = [];
  for (const note of piece.notes) {
    events.push({ time: note.start, type: 'noteon', note: note.note, velocity: note.velocity });
    events.push({ time: note.end, type: 'noteoff', note: note.note });
  }
  for (const change of piece.pedal) {
    events.push({ time: change.time, type: 'sustain', on: change.on });
  }
  // Array.prototype.sort is stable, so events of one kind keep their order.
  return events.sort((a, b) => a.time - b.time || ORDER[a.type] - ORDER[b.type]);
}

/** Index of the first event at or after `time` (events.length when there is none). */
export function indexAtTime(schedule: readonly ScheduleEvent[], time: number): number {
  let low = 0;
  let high = schedule.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (schedule[mid].time < time) low = mid + 1;
    else high = mid;
  }
  return low;
}

/** The events from `fromIndex` that are due at `toTime` (inclusive), and the index after them. */
export function drain(
  schedule: readonly ScheduleEvent[],
  fromIndex: number,
  toTime: number,
): { events: ScheduleEvent[]; index: number } {
  let index = fromIndex;
  while (index < schedule.length && schedule[index].time <= toTime) index++;
  return { events: schedule.slice(fromIndex, index), index };
}
