import { createContext, useContext } from 'react';
import type { MidiStatus, MidiSupport } from './midiAccess.ts';

export interface MidiValue {
  support: MidiSupport;
  /** `null` until the learner presses Connect. */
  status: MidiStatus | null;
  connect: () => void;
}

export const MidiContext = createContext<MidiValue | null>(null);

export function useMidi(): MidiValue {
  const value = useContext(MidiContext);
  if (!value) throw new Error('MidiProvider is missing');
  return value;
}
