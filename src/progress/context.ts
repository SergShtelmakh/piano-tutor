import { createContext, useContext } from 'react';
import type { Progress, RunReward } from '../core/progress.ts';

export interface ProgressValue {
  progress: Progress;
  /** False when `localStorage` is blocked: progress then lasts for this session only. */
  storageAvailable: boolean;
  /** Records one finished run and returns its rewards. */
  recordRun: (lessonId: string, accuracy: number) => RunReward;
  reset: () => void;
}

export const ProgressContext = createContext<ProgressValue | null>(null);

export function useProgress(): ProgressValue {
  const value = useContext(ProgressContext);
  if (!value) throw new Error('ProgressProvider is missing');
  return value;
}
