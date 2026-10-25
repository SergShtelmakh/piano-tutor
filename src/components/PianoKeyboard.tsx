import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { codeForNote, QWERTY_LABELS } from '../core/computerKeymap.ts';
import { isBlackKey, keyboardRange, pitchClass } from '../core/notes.ts';
import { useLocale, useT } from '../i18n/context.ts';
import { noteLabelFor, noteNameFor } from '../i18n/noteNames.ts';
import { useBaseOctave, useHeldNotes, useNoteBus } from '../input/context.ts';
import { loadKeyLabels } from '../input/keyboardLabels.ts';

const SCREEN_VELOCITY = 90;
const BLACK_KEY_WIDTH = 0.6; // relative to a white key

/** A key that briefly flashes after it was judged in a lesson. */
export interface KeyFeedback {
  note: number;
  kind: 'right' | 'wrong';
}

function keyColor(note: number, black: boolean, lit: ReadonlySet<number>, feedback?: KeyFeedback) {
  if (feedback?.note === note) {
    if (feedback.kind === 'right') return black ? 'bg-green-600' : 'bg-green-400';
    return black ? 'bg-red-600' : 'bg-red-400';
  }
  if (lit.has(note)) return black ? 'bg-sky-500' : 'bg-sky-300';
  return black ? 'bg-slate-800' : 'bg-white';
}

export default function PianoKeyboard({ feedback }: { feedback?: KeyFeedback | null }) {
  const t = useT();
  const { locale } = useLocale();
  const bus = useNoteBus();
  const { baseOctave } = useBaseOctave();
  const lit = useHeldNotes();
  const [keyLabels, setKeyLabels] = useState<Record<string, string>>({ ...QWERTY_LABELS });
  // pointerId -> note, so several fingers can hold several keys
  const pressed = useRef(new Map<number, number>());

  useEffect(() => {
    let cancelled = false;
    void loadKeyLabels().then((labels) => {
      if (!cancelled) setKeyLabels(labels);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const notes = keyboardRange(baseOctave);
  const whiteNotes = notes.filter((note) => !isBlackKey(note));
  const whiteWidth = 100 / whiteNotes.length;

  function press(event: PointerEvent<HTMLElement>, note: number) {
    if (event.button !== 0) return;
    // Touch pointers are captured by default; release so sliding off a key ends the note.
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (pressed.current.has(event.pointerId)) return;
    pressed.current.set(event.pointerId, note);
    bus.emit({ type: 'noteon', note, velocity: SCREEN_VELOCITY, source: 'screen' });
  }

  function release(event: PointerEvent<HTMLElement>) {
    const note = pressed.current.get(event.pointerId);
    if (note === undefined) return;
    pressed.current.delete(event.pointerId);
    bus.emit({ type: 'noteoff', note, source: 'screen' });
  }

  function keyProps(note: number) {
    return {
      type: 'button' as const,
      tabIndex: -1,
      'aria-label': noteLabelFor(locale, note),
      onPointerDown: (event: PointerEvent<HTMLElement>) => press(event, note),
      onPointerUp: release,
      onPointerCancel: release,
      onPointerLeave: release,
      onContextMenu: (event: { preventDefault(): void }) => event.preventDefault(),
    };
  }

  function computerKey(note: number): string | undefined {
    const code = codeForNote(note, baseOctave);
    return code ? keyLabels[code] : undefined;
  }

  return (
    <div
      role="group"
      aria-label={t('pianoLabel')}
      className="relative flex h-44 w-full touch-none select-none overflow-hidden rounded-b-lg border border-slate-400 bg-slate-400"
    >
      {whiteNotes.map((note) => (
        <button
          key={note}
          {...keyProps(note)}
          className={`flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-0.5 border-r border-slate-300 pb-1.5 text-slate-700 last:border-r-0 ${keyColor(
            note,
            false,
            lit,
            feedback ?? undefined,
          )}`}
        >
          <span className="text-[10px] font-semibold text-slate-500">{computerKey(note)}</span>
          <span className="text-[10px] leading-none sm:text-xs">
            {pitchClass(note) === 0 ? noteLabelFor(locale, note) : noteNameFor(locale, note)}
          </span>
        </button>
      ))}
      {notes.filter(isBlackKey).map((note) => {
        const whitesBefore = notes.filter((n) => n < note && !isBlackKey(n)).length;
        return (
          <button
            key={note}
            {...keyProps(note)}
            style={{
              left: `${whitesBefore * whiteWidth - (whiteWidth * BLACK_KEY_WIDTH) / 2}%`,
              width: `${whiteWidth * BLACK_KEY_WIDTH}%`,
            }}
            className={`absolute top-0 flex h-28 items-end justify-center rounded-b-md pb-1.5 text-[10px] font-semibold text-slate-200 ${keyColor(
              note,
              true,
              lit,
              feedback ?? undefined,
            )}`}
          >
            {computerKey(note)}
          </button>
        );
      })}
    </div>
  );
}
