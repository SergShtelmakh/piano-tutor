import { describe, expect, it } from 'vitest';
import { FIRST_STEP_X, ROW_WIDTH, STEP_SPACING, staffRow } from './staffRow.ts';

describe('staffRow', () => {
  it('places one note per step from left to right', () => {
    const row = staffRow([[60], [62], [64]]);
    expect(row.steps.map((step) => step.x)).toEqual([
      FIRST_STEP_X,
      FIRST_STEP_X + STEP_SPACING,
      FIRST_STEP_X + 2 * STEP_SPACING,
    ]);
    expect(row.steps[0].notes).toEqual([{ note: 60, clef: 'treble', index: 0, shifted: false }]);
    expect(row.steps[0].ledger).toEqual([0]);
    expect(row.steps[2].ledger).toEqual([]);
  });

  it('keeps the same width for any page, and 8 steps fit inside it', () => {
    expect(staffRow([[60]]).width).toBe(ROW_WIDTH);
    const eight = staffRow(Array.from({ length: 8 }, () => [64]));
    expect(eight.width).toBe(ROW_WIDTH);
    expect(eight.steps[7].x + 14).toBeLessThan(ROW_WIDTH);
  });

  it('cuts a page at 8 steps', () => {
    expect(staffRow(Array.from({ length: 10 }, () => [64])).steps).toHaveLength(8);
  });

  it('stacks a triad at one x, lowest note first, without shifts', () => {
    const [step] = staffRow([[67, 60, 64]]).steps;
    expect(step.notes.map((n) => n.note)).toEqual([60, 64, 67]);
    expect(step.notes.map((n) => n.index)).toEqual([0, 2, 4]);
    expect(step.notes.every((n) => !n.shifted)).toBe(true);
    expect(step.ledger).toEqual([0]);
  });

  it('moves the upper note of a second to the right', () => {
    const [step] = staffRow([[60, 62]]).steps;
    expect(step.notes.map((n) => n.shifted)).toEqual([false, true]);
  });

  it('does not shift the third note of a cluster that is already clear', () => {
    // C D E: D moves aside, E sits next to the shifted D but above C, so it needs no shift.
    const [step] = staffRow([[60, 62, 64]]).steps;
    expect(step.notes.map((n) => n.shifted)).toEqual([false, true, false]);
  });

  it('handles a step across the clefs', () => {
    const [step] = staffRow([[59, 62]]).steps;
    expect(step.notes.map((n) => n.clef)).toEqual(['bass', 'treble']);
    expect(step.notes.map((n) => n.shifted)).toEqual([false, false]);
    expect(step.ledger).toEqual([]);
  });

  it('shifts neighbouring notes across the clefs (B3 and C4)', () => {
    const [step] = staffRow([[59, 60]]).steps;
    expect(step.notes.map((n) => n.shifted)).toEqual([false, true]);
  });

  it('merges ledger lines of a step and sorts them', () => {
    // A3 (bass, index -3) needs none; C4 and the E3 below it share the lines on the way down.
    const [low] = staffRow([[40, 60]]).steps; // E2, C4
    expect(low.ledger).toEqual([...new Set(low.ledger)].sort((a, b) => a - b));
    expect(low.ledger).toContain(0);
    expect(low.ledger).toContain(-12);
    const [high] = staffRow([[72, 76]]).steps; // C5, E5: no ledger lines
    expect(high.ledger).toEqual([]);
  });

  it('skips black keys, which the staff cannot draw yet', () => {
    const [step] = staffRow([[60, 61, 64]]).steps;
    expect(step.notes.map((n) => n.note)).toEqual([60, 64]);
  });

  it('gives an empty row for no steps', () => {
    expect(staffRow([]).steps).toEqual([]);
  });
});
