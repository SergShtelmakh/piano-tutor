import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { codeForNote, QWERTY_LABELS } from '../core/computerKeymap.ts';
import { fixedRange, keyLayout, scrollTarget, shownRange } from '../core/keyboardLayout.ts';
import { isOutside } from '../core/keyboardRange.ts';
import {
  blackKeyHeightPx,
  keyboardHeightPx,
  type LayoutSize,
  type OctaveChoice,
} from '../core/lessonLayout.ts';
import { pitchClass } from '../core/notes.ts';
import { useLocale, useT } from '../i18n/context.ts';
import { noteLabelFor, noteNameFor } from '../i18n/noteNames.ts';
import { useBaseOctave, useHeldNotes, useNoteBus } from '../input/context.ts';
import { loadKeyLabels } from '../input/keyboardLabels.ts';
import { useKeyboardRange } from '../keyboard/context.ts';
import { useElementWidth } from './useElementWidth.ts';
import { useShortScreen } from './useWindowSize.ts';

const SCREEN_VELOCITY = 90;
/** Space kept free on each side of the piano; the screens already pad their content. */
const GUTTER = 0;

/** Smooth scrolling, unless the learner asked the system for less motion. */
function scrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

/** A key that briefly flashes after it was judged in a lesson. */
export interface KeyFeedback {
  note: number;
  kind: 'right' | 'wrong';
}

function keyColor(
  note: number,
  black: boolean,
  lit: ReadonlySet<number>,
  outside: boolean,
  feedback?: KeyFeedback,
) {
  if (feedback?.note === note) {
    return feedback.kind === 'right' ? 'bg-accent' : 'bg-wrong';
  }
  if (lit.has(note)) return black ? 'bg-accent' : 'bg-accent-strong';
  // Keys the learner's real keyboard doesn't have are dimmed, but still play and light up.
  if (outside) return black ? 'bg-line-strong' : 'bg-staff';
  return black ? 'bg-key-black' : 'bg-key-white';
}

export default function PianoKeyboard({
  feedback,
  focusNotes,
  include,
  followPlayback = false,
  hints,
  height = 'm',
  octaves = 'auto',
  allNames = true,
  shown,
}: {
  /** The piano's height (the lesson layout); a short screen has its own, smaller heights. */
  height?: LayoutSize;
  /** How many octaves to show; `auto` fits as many as the width allows. */
  octaves?: OctaveChoice;
  /** Name every white key; `false` names only the C keys and the keys that are lit. */
  allNames?: boolean;
  /** Keys drawn as lit without sound (the layout editor's example). */
  shown?: readonly number[];
  feedback?: KeyFeedback | null;
  /** Keys that get a ring: the notes to play now, when the learner asked for a hint. */
  hints?: readonly number[];
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
  const { range: keyboard } = useKeyboardRange();
  const heldNotes = useHeldNotes();
  const short = useShortScreen();
  // Notes drawn as lit without sound count as lit for the colour and for the label.
  const lit = useMemo<ReadonlySet<number>>(
    () => (shown && shown.length > 0 ? new Set([...heldNotes, ...shown]) : heldNotes),
    [heldNotes, shown],
  );
  const [keyLabels, setKeyLabels] = useState<Record<string, string>>({ ...QWERTY_LABELS });
  // pointerId -> note, so several fingers can hold several keys
  const pressed = useRef(new Map<number, number>());
  const scroller = useRef<HTMLDivElement>(null);
  // The piano is as wide as the space its screen gives it (the window, or the window minus the navigation).
  const root = useRef<HTMLDivElement>(null);
  const getRoot = useCallback(() => root.current, []);

  const viewportWidth = useElementWidth(getRoot, document.documentElement.clientWidth);
  const width = Math.max(0, viewportWidth - 2 * GUTTER);
  const includeLow = include?.low;
  const includeHigh = include?.high;
  const range = useMemo(() => {
    const included =
      includeLow !== undefined && includeHigh !== undefined
        ? { low: includeLow, high: includeHigh }
        : undefined;
    return octaves === 'auto'
      ? shownRange(width, baseOctave, included)
      : fixedRange(octaves, baseOctave, included);
  }, [width, baseOctave, includeLow, includeHigh, octaves]);
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
    scroller.current?.scrollTo({ left: 0, behavior: scrollBehavior() });
  }, [baseOctave]);

  // Bring the current notes into view (a lesson's step, or what plays), but not while a key is held.
  const focusKey = focusNotes?.join(',') ?? '';
  const focus = useMemo(() => (focusKey ? focusKey.split(',').map(Number) : []), [focusKey]);
  const heldCount = heldNotes.size;
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
    if (target !== null) el.scrollTo({ left: target, behavior: scrollBehavior() });
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
  const hinted = new Set(hints);

  return (
    <div ref={root} className="flex w-full justify-center">
      <div
        style={{ width }}
        className="shrink-0 overflow-hidden rounded-b-xl bg-line-strong ring-1 ring-line"
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
                className="relative h-7 touch-pan-x select-none border-b border-line bg-surface-raised"
              >
                {layout.keys
                  .filter((key) => !key.black && pitchClass(key.note) === 0)
                  .map((key) => (
                    <span
                      key={key.note}
                      style={{ left: key.x }}
                      className="absolute top-0 flex h-full items-center border-l border-line-strong pl-1 text-xs font-bold text-ink-muted"
                    >
                      {noteLabelFor(locale, key.note)}
                    </span>
                  ))}
              </div>
            )}
            <div
              role="group"
              aria-label={t('pianoLabel')}
              style={{ height: keyboardHeightPx(height, short) }}
              className="relative w-full touch-none select-none"
            >
              {layout.keys
                .filter((key) => !key.black)
                .map((key) => (
                  <button
                    key={key.note}
                    {...keyProps(key.note)}
                    style={{ left: key.x, width: key.w }}
                    className={`absolute top-0 flex h-full flex-col items-center justify-end gap-0.5 border-r border-key-black/25 pb-1.5 text-key-label ${keyColor(
                      key.note,
                      false,
                      lit,
                      isOutside(key.note, keyboard),
                      feedbackOrUndefined,
                    )}`}
                  >
                    {hinted.has(key.note) && (
                      <span
                        aria-hidden="true"
                        className="absolute bottom-10 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border-[2.5px] border-key-hint"
                      />
                    )}
                    <span className="text-[10px] font-semibold text-key-label">
                      {computerKey(key.note)}
                    </span>
                    <span className="text-[10px] leading-none sm:text-xs">
                      {pitchClass(key.note) === 0
                        ? noteLabelFor(locale, key.note)
                        : allNames || lit.has(key.note)
                          ? noteNameFor(locale, key.note)
                          : null}
                    </span>
                  </button>
                ))}
              {layout.keys
                .filter((key) => key.black)
                .map((key) => (
                  <button
                    key={key.note}
                    {...keyProps(key.note)}
                    style={{ left: key.x, width: key.w, height: blackKeyHeightPx(height, short) }}
                    className={`absolute top-0 flex items-end justify-center rounded-b-md border border-t-0 border-line pb-1.5 text-[10px] font-semibold text-ink-muted ${keyColor(
                      key.note,
                      true,
                      lit,
                      isOutside(key.note, keyboard),
                      feedbackOrUndefined,
                    )}`}
                  >
                    {hinted.has(key.note) && (
                      <span
                        aria-hidden="true"
                        className="absolute left-1/2 top-3 h-3 w-3 -translate-x-1/2 rounded-full border-[2.5px] border-accent"
                      />
                    )}
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
