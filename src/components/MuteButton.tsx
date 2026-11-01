import { useState } from 'react';
import { loadMuted, saveMuted } from '../audio/settings.ts';
import { useT } from '../i18n/context.ts';
import { useSynth } from '../input/context.ts';
import { MuteIcon, VolumeIcon } from './icons.tsx';
import { buttonIcon } from './ui.ts';

/** A one-tap mute for the play screens; the same saved setting as the one in Settings. */
export default function MuteButton() {
  const t = useT();
  const synth = useSynth();
  const [muted, setMuted] = useState(loadMuted);

  return (
    <button
      type="button"
      aria-pressed={muted}
      aria-label={muted ? t('unmute') : t('mute')}
      onClick={() => {
        setMuted(!muted);
        saveMuted(!muted);
        synth.setMuted(!muted);
      }}
      className={buttonIcon}
    >
      {muted ? <MuteIcon size={22} /> : <VolumeIcon size={22} />}
    </button>
  );
}
