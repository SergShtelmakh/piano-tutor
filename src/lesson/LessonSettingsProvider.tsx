import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { clampTempo, type LessonSettings } from '../core/practice.ts';
import { LessonSettingsContext, type LessonSettingsValue } from './settingsContext.ts';
import { loadLessonSettings, saveLessonSettings } from './settings.ts';

/** The tempo, metronome, and hint of the lessons: one value for every lesson, saved on the device. */
export function LessonSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<LessonSettings>(loadLessonSettings);

  const change = useCallback((patch: Partial<LessonSettings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      saveLessonSettings(next);
      return next;
    });
  }, []);

  const value = useMemo<LessonSettingsValue>(
    () => ({
      settings,
      setTempo: (bpm) => change({ tempo: clampTempo(bpm) }),
      setMetronome: (metronome) => change({ metronome }),
      setHint: (hint) => change({ hint }),
    }),
    [settings, change],
  );
  return <LessonSettingsContext.Provider value={value}>{children}</LessonSettingsContext.Provider>;
}
