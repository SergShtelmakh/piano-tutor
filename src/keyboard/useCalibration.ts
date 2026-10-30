import { useCallback, useEffect, useState } from 'react';
import {
  CALIBRATION_START,
  calibrationPress,
  type CalibrationState,
} from '../core/keyboardRange.ts';
import { useNoteBus } from '../input/context.ts';

export interface Calibration {
  /** The current step, or null when no calibration is running. */
  state: CalibrationState | null;
  start: () => void;
  cancel: () => void;
}

/**
 * Calibration of the keyboard size: the learner presses the lowest and then the highest key.
 * Only `noteon` events of a real MIDI device count (never the computer keyboard, the on-screen
 * piano, or playback), and it stops when the device goes away.
 */
export function useCalibration(connected: boolean): Calibration {
  const bus = useNoteBus();
  const [state, setState] = useState<CalibrationState | null>(null);

  // Calibration needs a device: when it disconnects the run is dropped (the old setting stays).
  if (!connected && state !== null) setState(null);

  const listening = state !== null && state.step !== 'done';
  useEffect(() => {
    if (!listening) return;
    return bus.subscribe((event) => {
      if (event.type !== 'noteon' || event.source !== 'midi') return;
      setState((current) => (current ? calibrationPress(current, event.note) : current));
    });
  }, [bus, listening]);

  const start = useCallback(() => setState(CALIBRATION_START), []);
  const cancel = useCallback(() => setState(null), []);
  return { state, start, cancel };
}
