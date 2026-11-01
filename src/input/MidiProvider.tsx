import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNoteBus, useSynth } from './context.ts';
import { connectMidi, getMidiSupport, type MidiStatus } from './midiAccess.ts';
import { MidiContext, type MidiValue } from './midiContext.ts';

/** Keeps the Web MIDI connection above the screens, so leaving Settings does not drop it. */
export function MidiProvider({ children }: { children: ReactNode }) {
  const bus = useNoteBus();
  const synth = useSynth();
  const [support] = useState(getMidiSupport);
  const [status, setStatus] = useState<MidiStatus | null>(null);
  const disconnect = useRef<(() => void) | null>(null);

  useEffect(() => () => disconnect.current?.(), []);

  const connect = useCallback(() => {
    synth.resume();
    disconnect.current?.();
    disconnect.current = null;
    void connectMidi(bus, setStatus).then((stop) => {
      disconnect.current = stop;
    });
  }, [bus, synth]);

  const value = useMemo<MidiValue>(
    () => ({ support, status, connect }),
    [support, status, connect],
  );

  return <MidiContext.Provider value={value}>{children}</MidiContext.Provider>;
}
