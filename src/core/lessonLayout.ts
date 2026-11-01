// Pure: how a lesson is laid out on the screen (Phase 21): the piano's height, how many octaves it
// shows, the rows of music, and the note names, kept apart for portrait and landscape. No React,
// DOM, audio, storage, or timers: the components read these values and the editor changes them.

export type Orientation = 'portrait' | 'landscape';

export const ORIENTATIONS: readonly Orientation[] = ['portrait', 'landscape'];

/** Taller than wide (or square) is portrait, as for the CSS `orientation` media feature. */
export function orientationOf(width: number, height: number): Orientation {
  return height >= width ? 'portrait' : 'landscape';
}

/** The four sizes of the piano and of a row of music. */
export type LayoutSize = 's' | 'm' | 'l' | 'xl';

export const LAYOUT_SIZES: readonly LayoutSize[] = ['s', 'm', 'l', 'xl'];

export type OctaveChoice = 'auto' | 1 | 2 | 3 | 4;

export const OCTAVE_CHOICES: readonly OctaveChoice[] = ['auto', 1, 2, 3, 4];

export type RowCount = 1 | 2 | 3;

export const ROW_COUNTS: readonly RowCount[] = [1, 2, 3];

export interface LessonLayout {
  /** The height of the lesson's piano. */
  keyboardHeight: LayoutSize;
  /** `auto` fits as many octaves as the width allows, as the piano always did. */
  octaves: OctaveChoice;
  /** Lines of music of a course lesson shown at once (a built-in lesson has one row). */
  rows: RowCount;
  /** The height of each row of music: the notation is scaled with it. */
  rowHeight: LayoutSize;
  /** `false`: only the C keys (and lit keys) show their name. */
  noteNames: boolean;
}

/** The layout a lesson had before Phase 21 (except that the key names are off by default). */
export const DEFAULT_LESSON_LAYOUT: LessonLayout = {
  keyboardHeight: 'm',
  octaves: 'auto',
  rows: 2,
  rowHeight: 'm',
  noteNames: false,
};

/** The piano's height in px; the second table is for a short screen (a phone held sideways). */
const KEYBOARD_HEIGHTS: Record<LayoutSize, { normal: number; short: number }> = {
  s: { normal: 140, short: 96 },
  m: { normal: 176, short: 112 },
  l: { normal: 216, short: 128 },
  xl: { normal: 256, short: 144 },
};

/** Black keys are this share of the piano's height (as the piano always drew them). */
const BLACK_KEY_SHARE = { normal: 0.636, short: 0.625 };

/** How much the notation grows or shrinks with the row height. */
export const ROW_SCALES: Record<LayoutSize, number> = { s: 0.8, m: 1, l: 1.25, xl: 1.5 };

export function keyboardHeightPx(size: LayoutSize, short: boolean): number {
  return KEYBOARD_HEIGHTS[size][short ? 'short' : 'normal'];
}

export function blackKeyHeightPx(size: LayoutSize, short: boolean): number {
  return Math.round(keyboardHeightPx(size, short) * BLACK_KEY_SHARE[short ? 'short' : 'normal']);
}

/** The size whose height is nearest to a dragged height. */
export function snapKeyboardHeight(px: number, short: boolean): LayoutSize {
  let best: LayoutSize = 'm';
  let bestDistance = Infinity;
  for (const size of LAYOUT_SIZES) {
    const distance = Math.abs(keyboardHeightPx(size, short) - px);
    if (distance < bestDistance) {
      best = size;
      bestDistance = distance;
    }
  }
  return best;
}

/** The next size up or down; it stays at S and XL. */
export function stepSize(size: LayoutSize, direction: 1 | -1): LayoutSize {
  const index = LAYOUT_SIZES.indexOf(size) + direction;
  return LAYOUT_SIZES[Math.min(LAYOUT_SIZES.length - 1, Math.max(0, index))];
}

function pick<T>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/** Reads a saved layout; every field that is missing or invalid takes its default on its own. */
export function parseLayout(value: unknown): LessonLayout {
  if (typeof value !== 'object' || value === null) return DEFAULT_LESSON_LAYOUT;
  const record = value as Record<string, unknown>;
  const defaults = DEFAULT_LESSON_LAYOUT;
  return {
    keyboardHeight: pick(record.keyboardHeight, LAYOUT_SIZES, defaults.keyboardHeight),
    octaves: pick(record.octaves, OCTAVE_CHOICES, defaults.octaves),
    rows: pick(record.rows, ROW_COUNTS, defaults.rows),
    rowHeight: pick(record.rowHeight, LAYOUT_SIZES, defaults.rowHeight),
    noteNames: typeof record.noteNames === 'boolean' ? record.noteNames : defaults.noteNames,
  };
}
