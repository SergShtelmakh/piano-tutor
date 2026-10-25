import { createContext, useContext, useSyncExternalStore } from 'react';
import type { Synth } from '../audio/synth.ts';
import type { LitStore } from './litStore.ts';
import type { NoteBus } from './noteBus.ts';

export interface NoteInputValue {
  bus: NoteBus;
  lit: LitStore;
  synth: Synth;
  baseOctave: number;
  shiftBaseOctave: (delta: number) => void;
  /** Sets the base octave directly (clamped), e.g. when a lesson needs a specific range. */
  setBaseOctave: (octave: number) => void;
}

export const NoteInputContext = createContext<NoteInputValue | null>(null);

function useNoteInput(): NoteInputValue {
  const value = useContext(NoteInputContext);
  if (!value) throw new Error('NoteInputProvider is missing');
  return value;
}

export function useNoteBus(): NoteBus {
  return useNoteInput().bus;
}

export function useSynth(): Synth {
  return useNoteInput().synth;
}

/** The octave of the C under the `A` key; the on-screen piano starts on the same C. */
export function useBaseOctave(): Pick<
  NoteInputValue,
  'baseOctave' | 'shiftBaseOctave' | 'setBaseOctave'
> {
  const { baseOctave, shiftBaseOctave, setBaseOctave } = useNoteInput();
  return { baseOctave, shiftBaseOctave, setBaseOctave };
}

/** The notes physically held right now, from any source. */
export function useHeldNotes(): ReadonlySet<number> {
  const { lit } = useNoteInput();
  return useSyncExternalStore(lit.subscribe, lit.getSnapshot);
}
