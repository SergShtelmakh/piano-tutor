import { describe, expect, it } from 'vitest';
import {
  keyLayout,
  MIN_WHITE_KEY_WIDTH,
  PIANO_HIGH,
  PIANO_LOW,
  scrollTarget,
  shownRange,
  whiteKeyCount,
} from './keyboardLayout.ts';
import { isBlackKey, keyboardRange } from './notes.ts';

function baseEnds(octave: number) {
  const notes = keyboardRange(octave);
  return { low: notes[0], high: notes[notes.length - 1] };
}

describe('shownRange', () => {
  const base = baseEnds(3); // B2 … C5: the B below C3, two octaves, and the top C

  it('keeps the base range when nothing more fits', () => {
    for (const width of [330, 640, 700]) {
      expect(shownRange(width, 3)).toEqual(base);
    }
  });

  it('adds one octave below first', () => {
    expect(shownRange(1000, 3)).toEqual({ low: base.low - 12, high: base.high });
  });

  it('then one above', () => {
    expect(shownRange(1280, 3)).toEqual({ low: base.low - 12, high: base.high + 12 });
  });

  it('shows the whole piano on a very wide screen', () => {
    expect(shownRange(2560, 3)).toEqual({ low: PIANO_LOW, high: PIANO_HIGH });
  });

  it('never makes white keys narrower than the minimum when it adds keys', () => {
    for (let width = 300; width <= 3000; width += 37) {
      for (const octave of [1, 3, 6]) {
        const range = shownRange(width, octave);
        if (whiteKeyCount(range) > whiteKeyCount(baseEnds(octave))) {
          expect(width / whiteKeyCount(range)).toBeGreaterThanOrEqual(MIN_WHITE_KEY_WIDTH);
        }
      }
    }
  });

  it('grows only upward, after a partial octave down to A0, at the bottom of the piano', () => {
    const b = baseEnds(1);
    const range = shownRange(1000, 1);
    expect(range.low).toBe(PIANO_LOW);
    expect(range.low).toBeLessThan(b.low);
    expect(range.high).toBeGreaterThan(b.high);
  });

  it('grows only downward at the top of the piano', () => {
    const b = baseEnds(6);
    expect(b.high).toBe(PIANO_HIGH);
    const range = shownRange(1000, 6);
    expect(range.high).toBe(PIANO_HIGH);
    expect(range.low).toBe(b.low - 12);
  });

  it('always contains the base range', () => {
    for (const octave of [1, 2, 3, 4, 5, 6]) {
      const b = baseEnds(octave);
      for (const width of [300, 900, 1500, 3000]) {
        const range = shownRange(width, octave);
        expect(range.low).toBeLessThanOrEqual(b.low);
        expect(range.high).toBeGreaterThanOrEqual(b.high);
      }
    }
  });
});

describe('keyLayout', () => {
  it('fills the width when the keys fit', () => {
    const layout = keyLayout(shownRange(1280, 3), 1280);
    expect(layout.scrolls).toBe(false);
    expect(layout.totalWidth).toBe(1280);
    expect(layout.whiteWidth).toBeGreaterThanOrEqual(MIN_WHITE_KEY_WIDTH);
    const whiteKeys = layout.keys.filter((key) => !key.black);
    const last = whiteKeys[whiteKeys.length - 1];
    expect(last.x + last.w).toBeCloseTo(1280);
  });

  it('fixes the key width and scrolls when the base range does not fit', () => {
    const layout = keyLayout(shownRange(330, 3), 330);
    expect(layout.scrolls).toBe(true);
    expect(layout.whiteWidth).toBe(MIN_WHITE_KEY_WIDTH);
    expect(layout.totalWidth).toBe(16 * MIN_WHITE_KEY_WIDTH);
  });

  it('does not scroll when the base range exactly fits', () => {
    const layout = keyLayout(shownRange(640, 3), 640);
    expect(layout.scrolls).toBe(false);
    expect(layout.whiteWidth).toBe(40);
  });

  it('places white keys side by side and black keys on the boundary', () => {
    const layout = keyLayout({ low: 60, high: 64 }, 300); // C C♯ D D♯ E
    const byNote = new Map(layout.keys.map((key) => [key.note, key]));
    expect(byNote.get(60)).toMatchObject({ black: false, x: 0, w: 100 });
    expect(byNote.get(62)).toMatchObject({ black: false, x: 100 });
    const sharp = byNote.get(61)!;
    expect(sharp.black).toBe(true);
    expect(sharp.w).toBeCloseTo(60);
    expect(sharp.x + sharp.w / 2).toBeCloseTo(100); // centred on the C|D boundary
  });

  it('has one box per note, in order', () => {
    const layout = keyLayout({ low: 47, high: 72 }, 1000);
    expect(layout.keys.map((key) => key.note)).toEqual(
      Array.from({ length: 26 }, (_, i) => 47 + i),
    );
  });
});

describe('scrollTarget', () => {
  const layout = keyLayout(shownRange(330, 3), 330); // 640 px of keys, 330 px visible
  const box = (n: number) => layout.keys.find((key) => key.note === n)!;

  it('returns null when the notes are already in view', () => {
    expect(scrollTarget(layout, [60], { left: box(60).x - 50, width: 330 })).toBeNull();
  });

  it('returns null for notes that are not on the piano', () => {
    expect(scrollTarget(layout, [100], { left: 0, width: 330 })).toBeNull();
  });

  it('centres a note that is out of view', () => {
    const key = box(60);
    const target = scrollTarget(layout, [60], { left: 0, width: 330 })!;
    expect(target + 165).toBeCloseTo(key.x + key.w / 2);
  });

  it('starts at the lowest key when the notes are wider than the view', () => {
    const target = scrollTarget(layout, [50, 70], { left: 300, width: 100 })!;
    expect(target).toBeCloseTo(box(50).x);
  });

  it('clamps at both ends', () => {
    expect(scrollTarget(layout, [layout.keys[0].note], { left: 200, width: 330 })).toBe(0);
    const last = layout.keys[layout.keys.length - 1].note;
    expect(scrollTarget(layout, [last], { left: 0, width: 330 })).toBe(layout.totalWidth - 330);
  });
});

describe('shownRange with include', () => {
  const base = baseEnds(3);

  it('does not change anything for a piece inside the base range', () => {
    expect(shownRange(330, 3, { low: 50, high: 70 })).toEqual(shownRange(330, 3));
  });

  it('covers a piece that reaches outside the base range, even on a narrow screen', () => {
    const range = shownRange(330, 3, { low: 36, high: 84 });
    expect(range.low).toBeLessThanOrEqual(36);
    expect(range.high).toBeGreaterThanOrEqual(84);
    expect(keyLayout(range, 330).scrolls).toBe(true);
  });

  it('starts and ends on a white key', () => {
    // 37 = C♯2 and 86 = D♯5 would be black-key ends.
    const range = shownRange(330, 3, { low: 37, high: 82 });
    expect(isBlackKey(range.low)).toBe(false);
    expect(isBlackKey(range.high)).toBe(false);
  });

  it('clips the piece to the piano', () => {
    expect(shownRange(330, 3, { low: 0, high: 127 })).toEqual({ low: PIANO_LOW, high: PIANO_HIGH });
  });

  it('adds octaves around the covered range as before when the screen is wide', () => {
    const wide = shownRange(2560, 3, { low: base.low, high: base.high });
    expect(wide).toEqual({ low: PIANO_LOW, high: PIANO_HIGH });
  });
});
