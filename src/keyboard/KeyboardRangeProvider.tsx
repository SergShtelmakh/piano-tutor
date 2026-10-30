import { useCallback, useMemo, useState, type ReactNode } from 'react';
import type { KeyboardRange } from '../core/keyboardRange.ts';
import { KeyboardRangeContext, type KeyboardRangeValue } from './context.ts';
import { loadKeyboardRange, saveKeyboardRange } from './storage.ts';

/** The learner's keyboard size, saved on the device after every change. */
export function KeyboardRangeProvider({ children }: { children: ReactNode }) {
  const [range, setRangeState] = useState<KeyboardRange>(loadKeyboardRange);

  const setRange = useCallback((next: KeyboardRange) => {
    setRangeState(next);
    saveKeyboardRange(next);
  }, []);

  const value = useMemo<KeyboardRangeValue>(() => ({ range, setRange }), [range, setRange]);
  return <KeyboardRangeContext.Provider value={value}>{children}</KeyboardRangeContext.Provider>;
}
