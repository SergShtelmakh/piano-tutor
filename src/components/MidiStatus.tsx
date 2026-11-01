import { useT } from '../i18n/context.ts';
import { useMidi } from '../input/midiContext.ts';
import KeyboardSizeControl from './KeyboardSizeControl.tsx';
import { buttonPrimary, buttonSmall } from './ui.ts';

/** The MIDI connection (kept by `MidiProvider`) and the size of the learner's keyboard. */
export default function MidiStatus() {
  const t = useT();
  const { support, status, connect } = useMidi();

  if (support === 'unsupported') return <p className="text-ink-muted">{t('midiUnsupported')}</p>;
  if (support === 'insecure') return <p className="text-ink-muted">{t('midiInsecure')}</p>;

  const showButton = status === null || status.state === 'denied';

  return (
    <div className="flex flex-col items-start gap-3">
      {showButton && (
        <button type="button" onClick={connect} className={`${buttonPrimary} ${buttonSmall}`}>
          {t('midiConnect')}
        </button>
      )}
      <p role="status" className="text-sm text-ink-muted">
        {status?.state === 'connecting' && t('midiConnecting')}
        {status?.state === 'connected' && `${t('midiConnected')} ${status.devices.join(', ')}`}
        {status?.state === 'no-devices' && t('midiNoDevices')}
        {status?.state === 'denied' && t('midiDenied')}
      </p>
      <KeyboardSizeControl connected={status?.state === 'connected'} />
    </div>
  );
}
