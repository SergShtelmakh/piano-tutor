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

export default function VolumeControl() {
  const t = useT();
  const synth = useSynth();
  const id = useId();
  const [volume, setVolume] = useState(loadVolume);
  const [muted, setMuted] = useState(loadMuted);
  const [reverb, setReverb] = useState(loadReverb);
  const loadStatus = useSyncExternalStore(synth.subscribeLoad, synth.loadStatus);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor={id} className="text-sm text-slate-600">
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
        className="w-28 accent-sky-600"
      />
      <button
        type="button"
        aria-pressed={muted}
        onClick={() => {
          setMuted(!muted);
          saveMuted(!muted);
          synth.setMuted(!muted);
        }}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm hover:bg-slate-100"
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
        className={`rounded-md border px-2 py-1 text-sm ${
          reverb
            ? 'border-sky-600 bg-sky-50 text-sky-800 hover:bg-sky-100'
            : 'border-slate-300 bg-white hover:bg-slate-100'
        }`}
      >
        {t('reverb')}
      </button>
      {loadStatus === 'loading' && (
        <span role="status" className="text-sm text-slate-500">
          {t('pianoLoading')}
        </span>
      )}
      {loadStatus === 'failed' && (
        <span role="alert" className="flex items-center gap-2 text-sm text-red-700">
          {t('pianoLoadFailed')}
          <button
            type="button"
            onClick={() => synth.retryLoad()}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-slate-800 hover:bg-slate-100"
          >
            {t('pianoRetry')}
          </button>
        </span>
      )}
    </div>
  );
}
