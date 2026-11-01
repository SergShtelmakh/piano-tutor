import { useEffect, useRef } from 'react';
import { appHistory, type LayerResult } from './history.ts';

/**
 * Makes something that sits on top of a screen (a lesson, the layout editor, a sheet) one step of
 * the browser history while `active`: Back calls `onBack`, which closes it and answers `'leave'`,
 * or keeps it open and answers `'stay'`. Closing it in the app takes the step away again.
 */
export function useBackLayer(name: string, active: boolean, onBack: () => LayerResult) {
  const latest = useRef(onBack);
  useEffect(() => {
    latest.current = onBack;
  });
  useEffect(() => {
    if (!active) return;
    return appHistory.addLayer(name, () => latest.current());
  }, [name, active]);
}
