import { isBlackKey, keyboardRange } from './notes.ts';

/** Narrowest white key (px) the on-screen piano allows; below this the piano scrolls. */
export const MIN_WHITE_KEY_WIDTH = 40;
/** The full piano: A0 to C8. */
export const PIANO_LOW = 21;
export const PIANO_HIGH = 108;

const OCTAVE = 12;
const BLACK_KEY_WIDTH = 0.6; // relative to a white key

export interface NoteRange {
  low: number;
  high: number;
}

export interface KeyBox {
  note: number;
  black: boolean;
  /** Left edge and width in px, inside the piano. */
  x: number;
  w: number;
}

export interface KeyLayout {
  whiteWidth: number;
  /** Width of all keys together; larger than the container when `scrolls` is true. */
  totalWidth: number;
  scrolls: boolean;
  keys: KeyBox[];
}

export function whiteKeyCount({ low, high }: NoteRange): number {
  let count = 0;
  for (let note = low; note <= high; note++) if (!isBlackKey(note)) count++;
  return count;
}

/**
 * The keys to show for a container width. It starts from the base range (the computer-keyboard
 * keys) and adds whole octaves, alternating below and above (below first), while the white keys
 * stay at least `MIN_WHITE_KEY_WIDTH` wide. Octaves are clipped to A0–C8.
 * With `include` (the notes of a piece being played) the starting range also covers those notes,
 * even when that is wider than `width`: the piano then keeps 40 px keys and scrolls.
 */
export function shownRange(width: number, baseOctave: number, include?: NoteRange): NoteRange {
  const base = keyboardRange(baseOctave);
  let range: NoteRange = { low: base[0], high: base[base.length - 1] };
  if (include) {
    range = {
      low: Math.min(range.low, Math.max(PIANO_LOW, include.low)),
      high: Math.max(range.high, Math.min(PIANO_HIGH, include.high)),
    };
    // A range starts and ends on a white key, so every black key has a white neighbour.
    if (isBlackKey(range.low)) range.low -= 1;
    if (isBlackKey(range.high)) range.high += 1;
  }
  const maxWhites = Math.floor(width / MIN_WHITE_KEY_WIDTH);
  let side: 'below' | 'above' = 'below';

  for (;;) {
    const below: NoteRange = { low: Math.max(PIANO_LOW, range.low - OCTAVE), high: range.high };
    const above: NoteRange = { low: range.low, high: Math.min(PIANO_HIGH, range.high + OCTAVE) };
    const candidates: NoteRange[] = side === 'below' ? [below, above] : [above, below];
    const next: NoteRange | undefined = candidates.find(
      (c) => (c.low !== range.low || c.high !== range.high) && whiteKeyCount(c) <= maxWhites,
    );
    if (!next) return range;
    side = next === below ? 'above' : 'below';
    range = next;
  }
}

/**
 * Pixel boxes for every key of `range` in a container `width` px wide. White keys fill the width
 * exactly; if that would make them narrower than the minimum, they are fixed at the minimum and
 * the piano is wider than the container (`scrolls`).
 */
export function keyLayout(range: NoteRange, width: number): KeyLayout {
  const whites = whiteKeyCount(range);
  const fitted = width / whites;
  const scrolls = fitted < MIN_WHITE_KEY_WIDTH;
  const whiteWidth = scrolls ? MIN_WHITE_KEY_WIDTH : fitted;
  const totalWidth = scrolls ? whites * whiteWidth : width;

  const keys: KeyBox[] = [];
  let whitesBefore = 0;
  for (let note = range.low; note <= range.high; note++) {
    if (isBlackKey(note)) {
      const w = whiteWidth * BLACK_KEY_WIDTH;
      keys.push({ note, black: true, x: whitesBefore * whiteWidth - w / 2, w });
    } else {
      keys.push({ note, black: false, x: whitesBefore * whiteWidth, w: whiteWidth });
      whitesBefore++;
    }
  }
  return { whiteWidth, totalWidth, scrolls, keys };
}

/**
 * The `scrollLeft` that brings `notes` into view, or `null` when they already are (or are not on
 * the piano). Notes that fit are centred; wider groups start at their lowest key.
 */
export function scrollTarget(
  layout: KeyLayout,
  notes: readonly number[],
  viewport: { left: number; width: number },
): number | null {
  const boxes = layout.keys.filter((key) => notes.includes(key.note));
  if (boxes.length === 0) return null;
  const start = Math.min(...boxes.map((key) => key.x));
  const end = Math.max(...boxes.map((key) => key.x + key.w));
  if (start >= viewport.left && end <= viewport.left + viewport.width) return null;

  const wanted = end - start <= viewport.width ? (start + end) / 2 - viewport.width / 2 : start;
  const target = Math.min(Math.max(0, wanted), Math.max(0, layout.totalWidth - viewport.width));
  return target === viewport.left ? null : target;
}
