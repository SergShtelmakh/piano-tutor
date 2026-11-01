import { describe, expect, it } from 'vitest';
import { EXAMPLE_STEP, layoutExample } from './layoutExample.ts';
import { layoutSystems } from './scoreLayout.ts';

describe('layoutExample', () => {
  const example = layoutExample();

  it('has notes in every step and a time for each', () => {
    expect(example.steps.length).toBeGreaterThan(20);
    expect(example.notation.stepTimes).toHaveLength(example.steps.length);
    for (const step of example.steps) expect(step.length).toBeGreaterThan(0);
  });

  it('uses both staves', () => {
    const clefs = example.notation.score.bars.map((bar) => ({
      treble: bar.columns.treble.some((column) => !column.rest),
      bass: bar.columns.bass.some((column) => !column.rest),
    }));
    expect(clefs.some((bar) => bar.treble)).toBe(true);
    expect(clefs.some((bar) => bar.bass)).toBe(true);
  });

  it('has times that grow and a range that covers every note', () => {
    const times = example.notation.stepTimes;
    for (let i = 1; i < times.length; i++) expect(times[i]).toBeGreaterThan(times[i - 1]);
    const notes = example.steps.flat();
    expect(example.range.low).toBe(Math.min(...notes));
    expect(example.range.high).toBe(Math.max(...notes));
  });

  it('fills at least three lines on a phone, a tablet, and a wide window at the smallest row height', () => {
    for (const width of [330, 800, 1300]) {
      expect(layoutSystems(example.notation.score, width).systems.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('holds a moment where both hands play', () => {
    const notes = example.steps[EXAMPLE_STEP];
    expect(notes.some((note) => note >= 60)).toBe(true);
    expect(notes.some((note) => note < 60)).toBe(true);
  });
});
