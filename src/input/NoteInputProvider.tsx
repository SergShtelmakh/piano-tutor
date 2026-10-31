import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { loadMuted, loadReverb, loadVolume } from '../audio/settings.ts';
import { createSynth } from '../audio/synth.ts';
import { shiftOctave } from '../core/computerKeymap.ts';
import { clampBaseOctave, DEFAULT_BASE_OCTAVE } from '../core/notes.ts';
import { attachComputerKeyboard } from './computerKeyboard.ts';
import { NoteInputContext, type NoteInputValue } from './context.ts';
import { createLitStore } from './litStore.ts';
import { createNoteBus } from './noteBus.ts';

function createServices() {
  const bus = createNoteBus();
  return {
    bus,
    lit: createLitStore(bus),
    synth: createSynth(bus, { volume: loadVolume(), muted: loadMuted(), reverb: loadReverb() }),
  };
}

/** Owns the one note pipeline: the bus, the synth and highlight listening to it, and the computer keyboard. */
export function NoteInputProvider({ children }: { children: ReactNode }) {
  const [services] = useState(createServices);
  const [baseOctave, setOctave] = useState(DEFAULT_BASE_OCTAVE);
  const baseOctaveRef = useRef(baseOctave);

  useEffect(() => {
    baseOctaveRef.current = baseOctave;
  }, [baseOctave]);

  const shiftBaseOctave = useCallback((delta: number) => {
    setOctave((current) => shiftOctave(current, delta));
  }, []);
  const setBaseOctave = useCallback((octave: number) => {
    setOctave(clampBaseOctave(octave));
  }, []);

  useEffect(
    () => attachComputerKeyboard(services.bus, () => baseOctaveRef.current, shiftBaseOctave),
    [services.bus, shiftBaseOctave],
  );

  // The piano samples start loading with the app, not with the first key.
  useEffect(() => services.synth.start(), [services.synth]);

  // Browsers only start audio after a user gesture.
  useEffect(() => {
    const resume = () => services.synth.resume();
    window.addEventListener('pointerdown', resume);
    window.addEventListener('keydown', resume);
    return () => {
      window.removeEventListener('pointerdown', resume);
      window.removeEventListener('keydown', resume);
    };
  }, [services.synth]);

  const value = useMemo<NoteInputValue>(
    () => ({ ...services, baseOctave, shiftBaseOctave, setBaseOctave }),
    [services, baseOctave, shiftBaseOctave, setBaseOctave],
  );

  return <NoteInputContext.Provider value={value}>{children}</NoteInputContext.Provider>;
}
