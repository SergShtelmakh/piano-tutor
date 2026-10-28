import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { layoutSystems, visibleSystems } from '../core/scoreLayout.ts';
import { useLocale, usePluralT, useT } from '../i18n/context.ts';
import { formatPercent } from '../i18n/core.ts';
import { usePlayerState, usePlayerValue, type PlayerError } from '../playback/context.ts';
import { MAX_RATE, MIN_RATE } from '../playback/player.ts';
import LibraryPanel from './LibraryPanel.tsx';
import PianoKeyboard from './PianoKeyboard.tsx';
import PieceInfo from './PieceInfo.tsx';
import ScoreView from './ScoreView.tsx';
import { useElementWidth } from './useElementWidth.ts';

const buttonClass =
  'rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white';
const PADDING = 16; // the score box has 8 px of padding on each side
const ERROR_KEYS = {
  notMidi: 'playerErrorNotMidi',
  unsupported: 'playerErrorUnsupported',
  empty: 'playerErrorEmpty',
  tooLarge: 'playerErrorTooLarge',
  damaged: 'playerErrorDamaged',
  network: 'playerErrorNetwork',
} as const satisfies Record<PlayerError, string>;

/** Seconds as m:ss. */
function formatTime(seconds: number): string {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

export default function PlayerScreen() {
  const t = useT();
  const tp = usePluralT();
  const { locale } = useLocale();
  const { player, loaded, error, openFile } = usePlayerValue();
  const state = usePlayerState();
  const fileInput = useRef<HTMLInputElement>(null);
  const libraryId = useId();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const getBox = useCallback(() => box.current, []);
  const boxWidth = useElementWidth(getBox, 328 + PADDING);

  // Leaving the Player stops the music; the open file stays for when the learner comes back.
  useEffect(() => () => player.pause(), [player]);

  const score = loaded?.score;
  const layout = useMemo(
    () => (score ? layoutSystems(score, Math.max(0, boxWidth - PADDING)) : null),
    [score, boxWidth],
  );
  const include = useMemo(
    () => (score ? { low: score.low, high: score.high } : undefined),
    [score],
  );
  const focusNotes = useMemo(() => [...state.sounding].sort((a, b) => a - b), [state.sounding]);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button type="button" className={buttonClass} onClick={() => fileInput.current?.click()}>
          {t('playerOpen')}
        </button>
        <button
          type="button"
          className={buttonClass}
          aria-expanded={libraryOpen}
          aria-controls={libraryId}
          onClick={() => setLibraryOpen((open) => !open)}
        >
          {t('playerLibrary')}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".mid,.midi,audio/midi,audio/x-midi"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = ''; // so choosing the same file again still counts
            if (file) {
              setLibraryOpen(false);
              void openFile(file);
            }
          }}
        />
        {loaded && !loaded.library && (
          <span className="font-semibold text-slate-800">{loaded.name}</span>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-800">
          {t(ERROR_KEYS[error])}
        </p>
      )}

      {libraryOpen && <LibraryPanel id={libraryId} onClose={() => setLibraryOpen(false)} />}

      {loaded?.library && <PieceInfo piece={loaded.library} />}

      <div ref={box} className="w-full">
        {loaded && layout ? (
          <ScoreView
            score={loaded.score}
            layout={layout}
            visible={visibleSystems(layout, state.position)}
            sounding={state.sounding}
            position={state.position}
            playing={state.playing}
            getPosition={player.positionNow}
            label={tp('playerScoreLabel', loaded.score.bars.length, { name: loaded.name })}
            onSeek={player.seek}
          />
        ) : (
          !error && (
            <p className="rounded-lg bg-white px-4 py-3 text-slate-600 shadow-sm">
              {t('playerHint')}
            </p>
          )
        )}
      </div>

      {loaded && (
        <div className="flex w-full flex-col gap-3 rounded-lg bg-white p-3 text-sm shadow-sm">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              className={buttonClass}
              onClick={state.playing ? player.pause : player.play}
            >
              {state.playing ? t('playerPause') : t('playerPlay')}
            </button>
            <button type="button" className={buttonClass} onClick={player.stop}>
              {t('playerStop')}
            </button>
          </div>
          <label className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-left text-slate-600">{t('playerPosition')}</span>
            <input
              type="range"
              min={0}
              max={state.duration}
              step={0.1}
              value={state.position}
              aria-valuetext={`${formatTime(state.position)} / ${formatTime(state.duration)}`}
              onChange={(event) => player.seek(Number(event.target.value))}
              className="min-w-0 flex-1"
            />
            <span className="w-24 shrink-0 text-right tabular-nums text-slate-700">
              {formatTime(state.position)} / {formatTime(state.duration)}
            </span>
          </label>
          <label className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-left text-slate-600">{t('playerTempo')}</span>
            <input
              type="range"
              min={MIN_RATE * 100}
              max={MAX_RATE * 100}
              step={5}
              value={Math.round(state.rate * 100)}
              aria-valuetext={formatPercent(locale, state.rate)}
              onChange={(event) => player.setRate(Number(event.target.value) / 100)}
              className="min-w-0 flex-1"
            />
            <span className="w-24 shrink-0 text-right tabular-nums text-slate-700">
              {formatPercent(locale, state.rate)}
            </span>
          </label>
        </div>
      )}

      <PianoKeyboard include={include} focusNotes={focusNotes} followPlayback />
    </div>
  );
}
