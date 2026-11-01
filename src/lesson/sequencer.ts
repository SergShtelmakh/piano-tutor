import type { TimedChunk } from '../core/practice.ts';
import type { NoteBus } from '../input/noteBus.ts';

/** How loud the app's own notes (Listen, the other hand) are, 1 to 127. */
const VELOCITY = 70;
const MIN_HOLD_SECONDS = 0.12;

export interface Sequencer {
  /**
   * Plays the chunks on the note bus (source `playback`), each starting `at` seconds from now and
   * held for `holdSeconds`. Adds to what is already scheduled.
   */
  schedule(chunks: readonly TimedChunk[], holdSeconds: number): void;
  /** Cancels what is waiting and releases every note it started. */
  stop(): void;
  /** True while something is scheduled or sounding. */
  busy(): boolean;
  /** Calls the listener when `busy()` may have changed. Returns the function that removes it. */
  subscribe(listener: () => void): () => void;
}

/**
 * Plays notes on the bus with timers. The notes are the app's own, so the judge ignores them.
 * Every `noteon` gets its `noteoff`, and `stop` releases whatever is sounding, so nothing sticks.
 */
export function createSequencer(bus: NoteBus): Sequencer {
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const sounding = new Set<number>();
  const listeners = new Set<() => void>();
  let wasBusy = false;

  const busy = () => timers.size > 0 || sounding.size > 0;
  const notify = () => {
    const now = busy();
    if (now === wasBusy) return;
    wasBusy = now;
    listeners.forEach((listener) => listener());
  };

  const later = (seconds: number, action: () => void) => {
    const timer = setTimeout(
      () => {
        timers.delete(timer);
        action();
        notify();
      },
      Math.max(0, seconds) * 1000,
    );
    timers.add(timer);
  };

  const release = (note: number) => {
    if (!sounding.delete(note)) return;
    bus.emit({ type: 'noteoff', note, source: 'playback' });
  };

  return {
    schedule(chunks, holdSeconds) {
      const hold = Math.max(MIN_HOLD_SECONDS, holdSeconds);
      for (const chunk of chunks) {
        later(chunk.at, () => {
          for (const note of chunk.notes) {
            release(note); // a repeated note is struck again
            sounding.add(note);
            bus.emit({ type: 'noteon', note, velocity: VELOCITY, source: 'playback' });
          }
          later(hold, () => chunk.notes.forEach(release));
        });
      }
      notify();
    },
    stop() {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
      [...sounding].forEach(release);
      notify();
    },
    busy,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
