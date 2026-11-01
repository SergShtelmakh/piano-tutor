import { useId, useState, useSyncExternalStore } from 'react';
import {
  loadMuted,
  loadReverb,
  loadVolume,
  saveMuted,
  saveReverb,
  saveVolume,
} from '../audio/settings.ts';
import { useT } from '../i18n/context.ts';
import { useSynth } from '../input/context.ts';
import { buttonOutline, buttonSmall, chip, chipOn } from './ui.ts';

export default function VolumeControl() {
  const t = useT();
  const synth = useSynth();
  const id = useId();
  const [volume, setVolume] = useState(loadVolume);
  const [muted, setMuted] = useState(loadMuted);
  const [reverb, setReverb] = useState(loadReverb);
  const loadStatus = useSyncExternalStore(synth.subscribeLoad, synth.loadStatus);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <label htmlFor={id} className="text-sm font-bold text-ink-muted">
          {t('volumeLabel')}
        </label>
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => {
            const next = Number(e.target.value);
            setVolume(next);
            saveVolume(next);
            synth.setVolume(next);
          }}
          className="h-11 w-48 max-w-full accent-accent"
        />
        <button
          type="button"
          aria-pressed={muted}
          onClick={() => {
            setMuted(!muted);
            saveMuted(!muted);
            synth.setMuted(!muted);
          }}
          className={muted ? chipOn : chip}
        >
          {muted ? t('unmute') : t('mute')}
        </button>
        <button
          type="button"
          aria-pressed={reverb}
          onClick={() => {
            setReverb(!reverb);
            saveReverb(!reverb);
            synth.setReverb(!reverb);
          }}
          className={reverb ? chipOn : chip}
        >
          {t('reverb')}
        </button>
      </div>
      {loadStatus === 'loading' && (
        <p role="status" className="text-sm text-ink-muted">
          {t('pianoLoading')}
        </p>
      )}
      {loadStatus === 'failed' && (
        <p role="alert" className="flex flex-wrap items-center gap-3 text-sm text-wrong">
          {t('pianoLoadFailed')}
          <button
            type="button"
            onClick={() => synth.retryLoad()}
            className={`${buttonOutline} ${buttonSmall}`}
          >
            {t('pianoRetry')}
          </button>
        </p>
      )}
    </div>
  );
}
