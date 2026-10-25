import { useId, useState } from 'react';
import { loadMuted, loadVolume, saveMuted, saveVolume } from '../audio/settings.ts';
import { useT } from '../i18n/context.ts';
import { useSynth } from '../input/context.ts';

export default function VolumeControl() {
  const t = useT();
  const synth = useSynth();
  const id = useId();
  const [volume, setVolume] = useState(loadVolume);
  const [muted, setMuted] = useState(loadMuted);

  return (
    <div className="flex items-center gap-2">
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
    </div>
  );
}
