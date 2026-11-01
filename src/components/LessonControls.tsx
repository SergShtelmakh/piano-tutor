import type { ReactNode } from 'react';
import { stepTempo, TEMPO, type PracticeHand } from '../core/practice.ts';
import { useT } from '../i18n/context.ts';
import type { MessageKey } from '../i18n/locales/en.ts';
import type { PracticeMode } from '../lesson/useLesson.ts';
import { BulbIcon, MetronomeIcon, PlayIcon, StopIcon } from './icons.tsx';

const tool =
  'inline-flex h-12 min-w-12 shrink-0 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40';
const toolOff = `${tool} bg-surface text-ink hover:bg-surface-raised`;
const toolOn = `${tool} bg-accent text-accent-ink hover:bg-accent-strong`;

/** Plays the current page (Listen), or stops it. The words are hidden on a phone held sideways. */
export function ListenButton({
  playing,
  disabled,
  onToggle,
}: {
  playing: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const t = useT();
  const label = t(playing ? 'lessonListenStop' : 'lessonListen');
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-label={label}
      className={playing ? toolOn : toolOff}
    >
      {playing ? <StopIcon size={20} /> : <PlayIcon size={20} />}
      <span className="short:sr-only">{label}</span>
    </button>
  );
}

/** − / tempo / + in beats per minute. */
export function TempoControl({ bpm, onChange }: { bpm: number; onChange: (bpm: number) => void }) {
  const t = useT();
  const button =
    'h-11 w-10 rounded-lg text-xl font-bold text-ink hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40';
  return (
    <div
      role="group"
      aria-label={t('lessonTempoLabel')}
      className="flex h-12 shrink-0 items-center rounded-xl bg-surface px-1"
    >
      <button
        type="button"
        className={button}
        aria-label={t('lessonTempoSlower')}
        disabled={bpm <= TEMPO.min}
        onClick={() => onChange(stepTempo(bpm, -1))}
      >
        <span aria-hidden="true">−</span>
      </button>
      <span
        role="status"
        className="min-w-16 text-center text-sm font-extrabold tabular-nums short:min-w-14"
      >
        {t('lessonTempoValue', { bpm })}
      </span>
      <button
        type="button"
        className={button}
        aria-label={t('lessonTempoFaster')}
        disabled={bpm >= TEMPO.max}
        onClick={() => onChange(stepTempo(bpm, 1))}
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}

function Toggle({
  label,
  pressed,
  onToggle,
  children,
}: {
  label: string;
  pressed: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      title={label}
      onClick={onToggle}
      className={pressed ? toolOn : toolOff}
    >
      {children}
    </button>
  );
}

export function MetronomeToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const t = useT();
  return (
    <Toggle label={t('lessonMetronome')} pressed={on} onToggle={onToggle}>
      <MetronomeIcon size={22} />
    </Toggle>
  );
}

export function HintToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const t = useT();
  return (
    <Toggle label={t('lessonHint')} pressed={on} onToggle={onToggle}>
      <BulbIcon size={22} />
    </Toggle>
  );
}

const HAND_OPTIONS: readonly { mode: PracticeMode; key: MessageKey }[] = [
  { mode: 'left', key: 'lessonHandLeft' },
  { mode: 'both', key: 'lessonHandBoth' },
  { mode: 'right', key: 'lessonHandRight' },
];

/** Left / Both / Right. A hand with no notes in the lesson can't be chosen. */
export function HandSwitch({
  hand,
  available,
  onChange,
}: {
  hand: PracticeMode;
  available: Record<PracticeHand, boolean>;
  onChange: (hand: PracticeMode) => void;
}) {
  const t = useT();
  return (
    <div
      role="group"
      aria-label={t('lessonHandsLabel')}
      className="flex h-12 shrink-0 gap-1 rounded-xl bg-surface p-1"
    >
      {HAND_OPTIONS.map(({ mode, key }) => (
        <button
          key={mode}
          type="button"
          aria-pressed={hand === mode}
          disabled={mode !== 'both' && !available[mode]}
          onClick={() => onChange(mode)}
          className={`min-w-11 rounded-lg px-3 text-sm disabled:cursor-not-allowed disabled:opacity-40 ${
            hand === mode
              ? 'bg-accent font-extrabold text-accent-ink'
              : 'font-bold text-ink hover:bg-surface-raised'
          }`}
        >
          {t(key)}
        </button>
      ))}
    </div>
  );
}
