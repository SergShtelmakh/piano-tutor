import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  EMPTY_PROGRESS,
  recordRun as applyRun,
  withLastLesson,
  type Progress,
} from '../core/progress.ts';
import { ProgressContext, type ProgressValue } from './context.ts';
import { clearProgress, loadProgress, saveProgress } from './storage.ts';
import { localDay } from './today.ts';

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(loadProgress);
  const [progress, setProgress] = useState<Progress>(initial.progress);
  const [storageAvailable, setStorageAvailable] = useState(initial.available);
  // Read by `recordRun`, so two runs in one tick cannot overwrite each other.
  const progressRef = useRef(progress);

  const recordRun = useCallback<ProgressValue['recordRun']>((lessonId, accuracy) => {
    const result = applyRun(progressRef.current, lessonId, accuracy, localDay());
    progressRef.current = result.progress;
    setProgress(result.progress);
    setStorageAvailable(saveProgress(result.progress));
    return result.reward;
  }, []);

  const setLastLesson = useCallback((lessonId: string) => {
    const next = withLastLesson(progressRef.current, lessonId);
    if (next === progressRef.current) return;
    progressRef.current = next;
    setProgress(next);
    setStorageAvailable(saveProgress(next));
  }, []);

  const reset = useCallback(() => {
    progressRef.current = EMPTY_PROGRESS;
    setProgress(EMPTY_PROGRESS);
    clearProgress();
  }, []);

  const value = useMemo(
    () => ({ progress, storageAvailable, recordRun, setLastLesson, reset }),
    [progress, storageAvailable, recordRun, setLastLesson, reset],
  );
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}
