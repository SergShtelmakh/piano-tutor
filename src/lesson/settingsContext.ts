import { createContext, useContext } from 'react';
import type { LessonLayout, Orientation } from '../core/lessonLayout.ts';
import type { LessonSettings } from '../core/practice.ts';

export interface LessonSettingsValue {
  settings: LessonSettings;
  setTempo: (bpm: number) => void;
  setMetronome: (on: boolean) => void;
  setHint: (on: boolean) => void;
  /** Changes some fields of the layout of one orientation. */
  setLayout: (orientation: Orientation, patch: Partial<LessonLayout>) => void;
  /** One orientation's layout and the hint back to their defaults. */
  resetLayout: (orientation: Orientation) => void;
}

export const LessonSettingsContext = createContext<LessonSettingsValue | null>(null);

export function useLessonSettings(): LessonSettingsValue {
  const value = useContext(LessonSettingsContext);
  if (!value) throw new Error('LessonSettingsProvider is missing');
  return value;
}
