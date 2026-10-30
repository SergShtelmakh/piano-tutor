import { describe, expect, it } from 'vitest';
import {
  CALIBRATION_START,
  KEY_COUNTS,
  calibrationPress,
  canShift,
  isOutside,
  keyCount,
  notesOutside,
  parseKeyboardRange,
  rangeForKeyCount,
  rangeFromNotes,
  serialiseKeyboardRange,
  shiftRange,
  standardKeyCount,
} from './keyboardRange.ts';

describe('key counts', () => {
  it.each([
    [25, 48, 72],
    [37, 48, 84],
    [49, 36, 84],
    [61, 36, 96],
    [76, 28, 103],
    [88, 21, 108],
  ] as const)('%i keys start from the usual note', (count, low, high) => {
    expect(rangeForKeyCount(count)).toEqual({ low, high });
    expect(keyCount(rangeForKeyCount(count))).toBe(count);
  });

  it('offers exactly the six sizes', () => {
    expect([...KEY_COUNTS]).toEqual([25, 37, 49, 61, 76, 88]);
  });

  it('returns a copy, so a caller cannot change the defaults', () => {
    rangeForKeyCount(25).low = 0;
    expect(rangeForKeyCount(25).low).toBe(48);
  });

  it('knows a standard size and calls a calibrated one non-standard', () => {
    expect(standardKeyCount({ low: 36, high: 96 })).toBe(61);
    expect(standardKeyCount({ low: 40, high: 71 })).toBeUndefined(); // 32 keys
  });
});

describe('shifting by octaves', () => {
  it('moves the whole range by 12 keys', () => {
    expect(shiftRange({ low: 48, high: 72 }, 1)).toEqual({ low: 60, high: 84 });
    expect(shiftRange({ low: 48, high: 72 }, -1)).toEqual({ low: 36, high: 60 });
  });

  it('stops at A0 and C8', () => {
    const bottom = { low: 21, high: 45 }; // 25 keys from A0
    expect(canShift(bottom, -1)).toBe(false);
    expect(shiftRange(bottom, -1)).toBe(bottom);
    const top = { low: 84, high: 108 };
    expect(canShift(top, 1)).toBe(false);
    expect(canShift(top, -1)).toBe(true);
  });

  it('cannot move 88 or 76 keys at all', () => {
    for (const count of [88, 76] as const) {
      const range = rangeForKeyCount(count);
      expect(canShift(range, 1)).toBe(false);
      expect(canShift(range, -1)).toBe(false);
    }
  });
});

describe('calibration', () => {
  it('takes the lowest, then the highest key', () => {
    let state = calibrationPress(CALIBRATION_START, 36);
    expect(state).toEqual({ step: 'highest', first: 36 });
    state = calibrationPress(state, 96);
    expect(state).toEqual({ step: 'done', range: { low: 36, high: 96 } });
  });

  it('sorts the two keys, whichever was pressed first', () => {
    const state = calibrationPress(calibrationPress(CALIBRATION_START, 96), 36);
    expect(state).toEqual({ step: 'done', range: { low: 36, high: 96 } });
    expect(rangeFromNotes(96, 36)).toEqual({ low: 36, high: 96 });
  });

  it('ignores the same key as the second press', () => {
    const first = calibrationPress(CALIBRATION_START, 60);
    expect(calibrationPress(first, 60)).toBe(first);
  });

  it('ignores notes that are not on a piano, and presses after it is done', () => {
    expect(calibrationPress(CALIBRATION_START, 10)).toBe(CALIBRATION_START);
    expect(calibrationPress(CALIBRATION_START, 120)).toBe(CALIBRATION_START);
    const done = calibrationPress(calibrationPress(CALIBRATION_START, 40), 80);
    expect(calibrationPress(done, 50)).toBe(done);
  });
});

describe('notes outside the range', () => {
  const range = { low: 48, high: 72 };

  it('is nothing when no range is set, or when everything fits', () => {
    expect(notesOutside([[20, 100]], null)).toEqual({ count: 0 });
    expect(notesOutside([[48], [60, 64], [72]], range)).toEqual({ count: 0 });
  });

  it('counts distinct pitches, not occurrences', () => {
    const steps = [[40], [40], [50, 40], [80], [81], [81]];
    expect(notesOutside(steps, range)).toEqual({ count: 3, lowest: 40, highest: 81 });
  });

  it('names only the side that has notes', () => {
    expect(notesOutside([[30, 35]], range)).toEqual({ count: 2, lowest: 30 });
    expect(notesOutside([[80, 90]], range)).toEqual({ count: 2, highest: 90 });
  });

  it('checks single notes against the range', () => {
    expect(isOutside(47, range)).toBe(true);
    expect(isOutside(48, range)).toBe(false);
    expect(isOutside(72, range)).toBe(false);
    expect(isOutside(73, range)).toBe(true);
    expect(isOutside(10, null)).toBe(false);
  });
});

describe('saved range', () => {
  it('round-trips', () => {
    const range = { low: 28, high: 103 };
    expect(parseKeyboardRange(serialiseKeyboardRange(range))).toEqual(range);
  });

  it.each([
    [null, 'nothing saved'],
    ['', 'empty'],
    ['not json', 'not json'],
    ['[1,2]', 'an array'],
    ['{"version":2,"low":36,"high":96}', 'a newer version'],
    ['{"low":36,"high":96}', 'no version'],
    ['{"version":1,"low":"36","high":96}', 'a string'],
    ['{"version":1,"low":36.5,"high":96}', 'not an integer'],
    ['{"version":1,"low":10,"high":96}', 'below A0'],
    ['{"version":1,"low":36,"high":120}', 'above C8'],
    ['{"version":1,"low":60,"high":60}', 'one key'],
    ['{"version":1,"low":80,"high":40}', 'upside down'],
  ])('reads %s as not set (%s)', (...args) => {
    expect(parseKeyboardRange(args[0])).toBeNull();
  });
});
