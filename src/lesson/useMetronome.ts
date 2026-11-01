import { useEffect, useRef } from 'react';
import { beatSeconds } from '../core/practice.ts';
import { useSynth } from '../input/context.ts';

/** How far ahead a click is handed to the audio clock, so a busy page cannot make it uneven. */
const LOOKAHEAD_MS = 100;
const TICK_MS = 25;

/**
 * Clicks on every beat at `bpm` while `active`. The first click is at once. A change of tempo
 * takes effect by the next beat at the latest.
 */
export function useMetronome(active: boolean, bpm: number): void {
  const synth = useSynth();
  const bpmRef = useRef(bpm);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    if (!active) return;
    let next = performance.now();
    let lastBpm = bpmRef.current;
    const tick = () => {
      const now = performance.now();
      if (bpmRef.current !== lastBpm) {
        lastBpm = bpmRef.current;
        next = Math.min(next, now + beatSeconds(lastBpm) * 1000);
      }
      while (next - now < LOOKAHEAD_MS) {
        synth.click(Math.max(0, next - now) / 1000);
        next += beatSeconds(lastBpm) * 1000;
      }
    };
    tick();
    const timer = setInterval(tick, TICK_MS);
    return () => clearInterval(timer);
  }, [active, synth]);
}
