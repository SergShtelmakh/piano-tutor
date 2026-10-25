import { useEffect, useRef, useState } from 'react';
import { useT } from '../i18n/context.ts';
import { useNoteBus, useSynth } from '../input/context.ts';
import { connectMidi, getMidiSupport, type MidiStatus as Status } from '../input/midiAccess.ts';

export default function MidiStatus() {
  const t = useT();
  const bus = useNoteBus();
  const synth = useSynth();
  const [support] = useState(getMidiSupport);
  const [status, setStatus] = useState<Status | null>(null);
  const disconnect = useRef<(() => void) | null>(null);

  useEffect(() => () => disconnect.current?.(), []);

  function connect() {
    synth.resume();
    disconnect.current?.();
    disconnect.current = null;
    void connectMidi(bus, setStatus).then((stop) => {
      disconnect.current = stop;
    });
  }

  if (support === 'unsupported')
    return <p className="text-sm text-slate-600">{t('midiUnsupported')}</p>;
  if (support === 'insecure') return <p className="text-sm text-slate-600">{t('midiInsecure')}</p>;

  const showButton = status === null || status.state === 'denied';

  return (
    <div className="flex flex-col items-center gap-2">
      {showButton && (
        <button
          type="button"
          onClick={connect}
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
        >
          {t('midiConnect')}
        </button>
      )}
      <p role="status" className="text-sm text-slate-600">
        {status?.state === 'connecting' && t('midiConnecting')}
        {status?.state === 'connected' && `${t('midiConnected')} ${status.devices.join(', ')}`}
        {status?.state === 'no-devices' && t('midiNoDevices')}
        {status?.state === 'denied' && t('midiDenied')}
      </p>
    </div>
  );
}
