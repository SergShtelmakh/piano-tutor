import { createContext, useContext } from 'react';
import type { LessonSettings } from '../core/practice.ts';

export interface LessonSettingsValue {
  settings: LessonSettings;
  setTempo: (bpm: number) => void;
  setMetronome: (on: boolean) => void;
  setHint: (on: boolean) => void;
}

export const LessonSettingsContext = createContext<LessonSettingsValue | null>(null);

export function useLessonSettings(): LessonSettingsValue {
  const value = useContext(LessonSettingsContext);
  if (!value) throw new Error('LessonSettingsProvider is missing');
  return value;
}
