import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { codeForNote, QWERTY_LABELS } from '../core/computerKeymap.ts';
import { keyLayout, scrollTarget, shownRange } from '../core/keyboardLayout.ts';
import { pitchClass } from '../core/notes.ts';
import { useLocale, useT } from '../i18n/context.ts';
import { noteLabelFor, noteNameFor } from '../i18n/noteNames.ts';
import { useBaseOctave, useHeldNotes, useNoteBus } from '../input/context.ts';
import { loadKeyLabels } from '../input/keyboardLabels.ts';
import { useElementWidth } from './useElementWidth.ts';

const SCREEN_VELOCITY = 90;
/** Space kept free on each side of the full-width piano. */
const GUTTER = 16;

/** The piano is as wide as the window (minus the scrollbar), not as wide as the text column. */
const getRoot = () => document.documentElement;

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

export default function PianoKeyboard({
  feedback,
  focusNotes,
  include,
  followPlayback = false,
}: {
  feedback?: KeyFeedback | null;
  /** Notes the view should bring into sight when it scrolls (a lesson's current step). */
  focusNotes?: readonly number[];
  /** The notes of a piece being played: the piano shows at least this range (clipped to A0–C8). */
  include?: { low: number; high: number };
  /**
   * The view follows notes that are held by playback, so only a finger or the mouse holding a
   * key stops it from scrolling (a lesson also waits for keys of the computer keyboard).
   */
  followPlayback?: boolean;
}) {
  const t = useT();
  const { locale } = useLocale();
  const bus = useNoteBus();
  const { baseOctave } = useBaseOctave();
  const lit = useHeldNotes();
  const [keyLabels, setKeyLabels] = useState<Record<string, string>>({ ...QWERTY_LABELS });
  // pointerId -> note, so several fingers can hold several keys
  const pressed = useRef(new Map<number, number>());
  const scroller = useRef<HTMLDivElement>(null);

  const viewportWidth = useElementWidth(getRoot, getRoot().clientWidth);
  const width = Math.max(0, viewportWidth - 2 * GUTTER);
  const includeLow = include?.low;
  const includeHigh = include?.high;
  const range = useMemo(
    () =>
      shownRange(
        width,
        baseOctave,
        includeLow !== undefined && includeHigh !== undefined
          ? { low: includeLow, high: includeHigh }
          : undefined,
      ),
    [width, baseOctave, includeLow, includeHigh],
  );
  const layout = useMemo(() => keyLayout(range, width), [range, width]);
  const { low, high } = range;

  useEffect(() => {
    let cancelled = false;
    void loadKeyLabels().then((labels) => {
      if (!cancelled) setKeyLabels(labels);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // A resize can remove a key that a finger is holding: release it, so no note gets stuck.
  useEffect(() => {
    for (const [pointerId, note] of pressed.current) {
      if (note < low || note > high) {
        pressed.current.delete(pointerId);
        bus.emit({ type: 'noteoff', note, source: 'screen' });
      }
    }
  }, [low, high, bus]);

  // Centre the keys on first show and after a resize or rotation.
  useEffect(() => {
    const el = scroller.current;
    if (el && layout.scrolls) el.scrollLeft = (layout.totalWidth - el.clientWidth) / 2;
  }, [layout.scrolls, layout.totalWidth, width]);

  // After Z / X or the octave buttons, show the new range from its lower end.
  const previousOctave = useRef(baseOctave);
  useEffect(() => {
    if (previousOctave.current === baseOctave) return;
    previousOctave.current = baseOctave;
    scroller.current?.scrollTo({ left: 0, behavior: 'smooth' });
  }, [baseOctave]);

  // Bring the current notes into view (a lesson's step, or what plays), but not while a key is held.
  const focusKey = focusNotes?.join(',') ?? '';
  const focus = useMemo(() => (focusKey ? focusKey.split(',').map(Number) : []), [focusKey]);
  const heldCount = lit.size;
  const pendingFocus = useRef(false);
  useEffect(() => {
    pendingFocus.current = focusKey !== '';
  }, [focusKey, layout]);
  useEffect(() => {
    const el = scroller.current;
    const blocked = followPlayback ? pressed.current.size > 0 : heldCount > 0;
    if (!el || !pendingFocus.current || blocked) return;
    pendingFocus.current = false;
    const target = scrollTarget(layout, focus, {
      left: el.scrollLeft,
      width: el.clientWidth,
    });
    if (target !== null) el.scrollTo({ left: target, behavior: 'smooth' });
  }, [focus, layout, heldCount, followPlayback]);

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

  const feedbackOrUndefined = feedback ?? undefined;

  return (
    <div className="flex w-full justify-center">
      <div
        style={{ width }}
        className="shrink-0 overflow-hidden rounded-b-lg bg-slate-400 ring-1 ring-slate-400"
      >
        <div
          ref={scroller}
          className={layout.scrolls ? 'overflow-x-auto overscroll-x-contain' : 'overflow-x-hidden'}
        >
          <div style={{ width: layout.totalWidth }}>
            {layout.scrolls && (
              <div
                role="group"
                aria-label={t('pianoScrollLabel')}
                className="relative h-7 touch-pan-x select-none border-b border-slate-400 bg-slate-100"
              >
                {layout.keys
                  .filter((key) => !key.black && pitchClass(key.note) === 0)
                  .map((key) => (
                    <span
                      key={key.note}
                      style={{ left: key.x }}
                      className="absolute top-0 flex h-full items-center border-l border-slate-400 pl-1 text-xs font-semibold text-slate-600"
                    >
                      {noteLabelFor(locale, key.note)}
                    </span>
                  ))}
              </div>
            )}
            <div
              role="group"
              aria-label={t('pianoLabel')}
              className="relative h-44 w-full touch-none select-none"
            >
              {layout.keys
                .filter((key) => !key.black)
                .map((key) => (
                  <button
                    key={key.note}
                    {...keyProps(key.note)}
                    style={{ left: key.x, width: key.w }}
                    className={`absolute top-0 flex h-full flex-col items-center justify-end gap-0.5 border-r border-slate-300 pb-1.5 text-slate-700 ${keyColor(
                      key.note,
                      false,
                      lit,
                      feedbackOrUndefined,
                    )}`}
                  >
                    <span className="text-[10px] font-semibold text-slate-500">
                      {computerKey(key.note)}
                    </span>
                    <span className="text-[10px] leading-none sm:text-xs">
                      {pitchClass(key.note) === 0
                        ? noteLabelFor(locale, key.note)
                        : noteNameFor(locale, key.note)}
                    </span>
                  </button>
                ))}
              {layout.keys
                .filter((key) => key.black)
                .map((key) => (
                  <button
                    key={key.note}
                    {...keyProps(key.note)}
                    style={{ left: key.x, width: key.w }}
                    className={`absolute top-0 flex h-28 items-end justify-center rounded-b-md pb-1.5 text-[10px] font-semibold text-slate-200 ${keyColor(
                      key.note,
                      true,
                      lit,
                      feedbackOrUndefined,
                    )}`}
                  >
                    {computerKey(key.note)}
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
