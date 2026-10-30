import { createContext, useContext } from 'react';
import type { KeyboardRange } from '../core/keyboardRange.ts';

export interface KeyboardRangeValue {
  /** The keys of the learner's real keyboard, or null while nothing is set. */
  range: KeyboardRange;
  setRange: (range: KeyboardRange) => void;
}

export const KeyboardRangeContext = createContext<KeyboardRangeValue | null>(null);

export function useKeyboardRange(): KeyboardRangeValue {
  const value = useContext(KeyboardRangeContext);
  if (!value) throw new Error('KeyboardRangeProvider is missing');
  return value;
}
