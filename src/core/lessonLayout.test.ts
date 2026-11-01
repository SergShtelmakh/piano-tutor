import { describe, expect, it } from 'vitest';
import {
  blackKeyHeightPx,
  DEFAULT_LESSON_LAYOUT,
  keyboardHeightPx,
  orientationOf,
  parseLayout,
  ROW_SCALES,
  snapKeyboardHeight,
  stepSize,
} from './lessonLayout.ts';

describe('orientationOf', () => {
  it('is portrait when taller than wide, and for a square', () => {
    expect(orientationOf(390, 844)).toBe('portrait');
    expect(orientationOf(800, 800)).toBe('portrait');
  });

  it('is landscape when wider than tall', () => {
    expect(orientationOf(844, 390)).toBe('landscape');
    expect(orientationOf(1440, 900)).toBe('landscape');
  });
});

describe('keyboard heights', () => {
  it('keeps the heights the piano had before (M)', () => {
    expect(keyboardHeightPx('m', false)).toBe(176);
    expect(keyboardHeightPx('m', true)).toBe(112);
    expect(blackKeyHeightPx('m', false)).toBe(112);
    expect(blackKeyHeightPx('m', true)).toBe(70);
  });

  it('grows from S to XL, on a normal and on a short screen', () => {
    for (const short of [false, true]) {
      const heights = (['s', 'm', 'l', 'xl'] as const).map((size) => keyboardHeightPx(size, short));
      expect(heights).toEqual([...heights].sort((a, b) => a - b));
      expect(new Set(heights).size).toBe(4);
    }
  });

  it('keeps the black keys shorter than the white ones', () => {
    for (const size of ['s', 'm', 'l', 'xl'] as const) {
      expect(blackKeyHeightPx(size, false)).toBeLessThan(keyboardHeightPx(size, false));
      expect(blackKeyHeightPx(size, true)).toBeLessThan(keyboardHeightPx(size, true));
    }
  });
});

describe('snapKeyboardHeight', () => {
  it('takes the nearest size', () => {
    expect(snapKeyboardHeight(176, false)).toBe('m');
    expect(snapKeyboardHeight(150, false)).toBe('s');
    expect(snapKeyboardHeight(200, false)).toBe('l');
    expect(snapKeyboardHeight(240, false)).toBe('xl');
  });

  it('stays at S and XL beyond the ends', () => {
    expect(snapKeyboardHeight(0, false)).toBe('s');
    expect(snapKeyboardHeight(2000, false)).toBe('xl');
  });

  it('uses the short table on a short screen', () => {
    expect(snapKeyboardHeight(112, true)).toBe('m');
    expect(snapKeyboardHeight(140, true)).toBe('xl');
  });
});

describe('stepSize', () => {
  it('moves one size and stops at the ends', () => {
    expect(stepSize('m', 1)).toBe('l');
    expect(stepSize('m', -1)).toBe('s');
    expect(stepSize('xl', 1)).toBe('xl');
    expect(stepSize('s', -1)).toBe('s');
  });
});

describe('row scales', () => {
  it('leave M as it was and grow with the size', () => {
    expect(ROW_SCALES.m).toBe(1);
    expect(ROW_SCALES.s).toBeLessThan(1);
    expect(ROW_SCALES.xl).toBeGreaterThan(ROW_SCALES.l);
  });
});

describe('parseLayout', () => {
  it('reads a valid layout', () => {
    const layout = {
      keyboardHeight: 'xl',
      octaves: 3,
      rows: 3,
      rowHeight: 'l',
      noteNames: true,
    };
    expect(parseLayout(layout)).toEqual(layout);
  });

  it('gives the defaults for junk', () => {
    expect(parseLayout(null)).toEqual(DEFAULT_LESSON_LAYOUT);
    expect(parseLayout(7)).toEqual(DEFAULT_LESSON_LAYOUT);
    expect(parseLayout('xl')).toEqual(DEFAULT_LESSON_LAYOUT);
  });

  it('falls back field by field', () => {
    expect(parseLayout({ keyboardHeight: 'huge', rows: 3, octaves: 5, noteNames: 'yes' })).toEqual({
      ...DEFAULT_LESSON_LAYOUT,
      rows: 3,
    });
  });
});
