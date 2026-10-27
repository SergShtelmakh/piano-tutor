// The playback driver: a clock that walks through the schedule of a piece and emits its notes
// on the note bus with source 'playback'. No React; the clock is injectable for tests.
import { buildSchedule, drain, indexAtTime, type ScheduleEvent } from '../core/playback.ts';
import type { Piece } from '../core/smf.ts';
import type { NoteBus } from '../input/noteBus.ts';

/** How often due events are emitted: well inside the 20 ms the spec allows. */
const TICK_MS = 10;
/** How often subscribers learn the position while playing (the cursor reads it more often). */
const NOTIFY_MS = 100;
export const MIN_RATE = 0.5;
export const MAX_RATE = 1.5;

export interface Clock {
  /** Milliseconds from any fixed start. */
  now(): number;
  setInterval(callback: () => void, ms: number): unknown;
  clearInterval(id: unknown): void;
}

export const realClock: Clock = {
  now: () => performance.now(),
  setInterval: (callback, ms) => setInterval(callback, ms),
  clearInterval: (id) => clearInterval(id as ReturnType<typeof setInterval>),
};

export interface PlayerState {
  loaded: boolean;
  playing: boolean;
  /** Tempo factor: 1 is the file's own tempo. */
  rate: number;
  /** Seconds into the piece at 100 % tempo, as of the last notification. */
  position: number;
  duration: number;
  /** Notes that playback is holding right now. */
  sounding: ReadonlySet<number>;
}

export interface Player {
  load(piece: Piece | null): void;
  play(): void;
  pause(): void;
  /** Stops and goes back to the start. */
  stop(): void;
  seek(seconds: number): void;
  setRate(rate: number): void;
  /** The exact position now (use it for the moving cursor; `getState().position` is coarser). */
  positionNow(): number;
  /** A new object whenever something changed, so it works with `useSyncExternalStore`. */
  getState(): PlayerState;
  subscribe(listener: () => void): () => void;
  /** Silences everything and stops the clock. The player can be used again afterwards. */
  dispose(): void;
}

export function createPlayer(bus: NoteBus, clock: Clock = realClock): Player {
  let schedule: ScheduleEvent[] = [];
  let duration = 0;
  let loaded = false;
  let playing = false;
  let rate = 1;
  let position = 0;
  // While playing: the position at `startedAt` (clock time), so no drift can build up.
  let basePosition = 0;
  let startedAt = 0;
  let nextIndex = 0;
  let timer: unknown = null;
  let lastNotify = 0;

  const held = new Set<number>();
  let pedal = false;
  let state: PlayerState = snapshot();
  const listeners = new Set<() => void>();

  function snapshot(): PlayerState {
    return {
      loaded,
      playing,
      rate,
      position: positionNow(),
      duration,
      sounding: new Set(held),
    };
  }

  function notify() {
    state = snapshot();
    lastNotify = clock.now();
    listeners.forEach((listener) => listener());
  }

  function positionNow(): number {
    if (!playing) return position;
    const elapsed = ((clock.now() - startedAt) / 1000) * rate;
    return Math.min(duration, basePosition + elapsed);
  }

  /** Returns true when the set of held notes changed. */
  function emit(event: ScheduleEvent): boolean {
    switch (event.type) {
      case 'noteon':
        held.add(event.note);
        bus.emit({
          type: 'noteon',
          note: event.note,
          velocity: event.velocity,
          source: 'playback',
        });
        return true;
      case 'noteoff':
        if (!held.delete(event.note)) return false;
        bus.emit({ type: 'noteoff', note: event.note, source: 'playback' });
        return true;
      case 'sustain':
        if (pedal !== event.on) {
          pedal = event.on;
          bus.emit({ type: 'sustain', on: event.on, source: 'playback' });
        }
        return false;
    }
  }

  function releaseAll() {
    for (const note of held) bus.emit({ type: 'noteoff', note, source: 'playback' });
    held.clear();
    if (pedal) {
      pedal = false;
      bus.emit({ type: 'sustain', on: false, source: 'playback' });
    }
  }

  function startTimer() {
    stopTimer();
    timer = clock.setInterval(tick, TICK_MS);
  }

  function stopTimer() {
    if (timer !== null) clock.clearInterval(timer);
    timer = null;
  }

  function tick() {
    const now = positionNow();
    if (now >= duration) {
      finish();
      return;
    }
    const due = drain(schedule, nextIndex, now);
    nextIndex = due.index;
    let changed = false;
    for (const event of due.events) changed = emit(event) || changed;
    if (changed || clock.now() - lastNotify >= NOTIFY_MS) notify();
  }

  /** The end of the piece: play out the last events, release everything, go back to the start. */
  function finish() {
    for (const event of drain(schedule, nextIndex, Infinity).events) emit(event);
    stopTimer();
    releaseAll();
    playing = false;
    position = 0;
    nextIndex = 0;
    notify();
  }

  function stop() {
    stopTimer();
    playing = false;
    releaseAll();
    position = 0;
    nextIndex = 0;
    notify();
  }

  function load(piece: Piece | null) {
    stop();
    loaded = piece !== null;
    schedule = piece ? buildSchedule(piece) : [];
    duration = piece?.duration ?? 0;
    notify();
  }

  function play() {
    if (!loaded || playing) return;
    if (position >= duration) position = 0;
    basePosition = position;
    startedAt = clock.now();
    nextIndex = indexAtTime(schedule, position);
    playing = true;
    startTimer();
    notify();
  }

  function pause() {
    if (!playing) return;
    position = positionNow();
    stopTimer();
    playing = false;
    releaseAll();
    notify();
  }

  function seek(seconds: number) {
    const target = Math.min(duration, Math.max(0, seconds));
    releaseAll();
    position = target;
    basePosition = target;
    startedAt = clock.now();
    nextIndex = indexAtTime(schedule, target);
    notify();
  }

  function setRate(next: number) {
    if (playing) {
      position = positionNow();
      basePosition = position;
      startedAt = clock.now();
    }
    rate = Math.min(MAX_RATE, Math.max(MIN_RATE, next));
    notify();
  }

  return {
    load,
    play,
    pause,
    stop,
    seek,
    setRate,
    positionNow,
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispose() {
      stopTimer();
      playing = false;
      releaseAll();
    },
  };
}
