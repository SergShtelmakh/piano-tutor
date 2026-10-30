import { describe, expect, it } from 'vitest';
import {
  MAX_SLOPE_STEPS,
  MIN_STEM_STEPS,
  beamGroups,
  beamLine,
  beatUnits,
  heightAt,
} from './beams.ts';
import { buildScore, type ScoreBar } from './score.ts';
import type { Piece, TimeSignature } from './smf.ts';

// One tick is one sixteenth note (4 ticks per quarter): an eighth is 2 ticks, a quarter 4.
function barOf(
  notes: [note: number, start: number, end: number][],
  signature: TimeSignature = { tick: 0, numerator: 4, denominator: 4 },
): ScoreBar {
  const piece: Piece = {
    ticksPerQuarter: 4,
    notes: notes.map(([note, startTick, endTick]) => ({
      note,
      startTick,
      endTick,
      start: startTick * 0.125,
      end: endTick * 0.125,
      velocity: 80,
    })),
    pedal: [],
    tempos: [{ tick: 0, time: 0, microsPerQuarter: 500_000 }],
    timeSignatures: [signature],
    duration: 0,
  };
  return buildScore(piece).bars[0];
}

/** `count` notes of `length` ticks in a row from tick 0, all on the same pitch. */
function row(count: number, length: number, note = 72): [number, number, number][] {
  return Array.from({ length: count }, (_, i) => [note, i * length, (i + 1) * length]);
}

const groupsOf = (bar: ScoreBar) => beamGroups(bar, 'treble').map((group) => group.columns);

describe('beatUnits', () => {
  it.each([
    [2, 4, 4],
    [3, 4, 4],
    [4, 4, 4],
    [5, 4, 4],
    [2, 2, 8],
    [4, 2, 8],
    [6, 8, 6],
    [9, 8, 6],
    [12, 8, 6],
    [3, 8, 6],
    [5, 8, 4],
    [7, 8, 4],
    [6, 16, 4],
    [4, 1, 16],
  ])('%i/%i has a beat of %i sixteenths', (numerator, denominator, units) => {
    expect(beatUnits({ numerator, denominator })).toBe(units);
  });
});

describe('beamGroups: which notes are joined', () => {
  it('joins eighths in pairs, one pair per beat, in 4/4', () => {
    expect(groupsOf(barOf(row(8, 2)))).toEqual([
      [0, 1],
      [2, 3],
      [4, 5],
      [6, 7],
    ]);
  });

  it('joins sixteenths in fours in 4/4, with a second beam over each four', () => {
    const groups = beamGroups(barOf(row(16, 1)), 'treble');
    expect(groups.map((g) => g.columns)).toEqual([
      [0, 1, 2, 3],
      [4, 5, 6, 7],
      [8, 9, 10, 11],
      [12, 13, 14, 15],
    ]);
    expect(groups.every((g) => g.secondary.length === 1 && g.hooks.length === 0)).toBe(true);
    expect(groups[0].secondary[0]).toEqual({ from: 0, to: 3 });
  });

  it('joins eighths in pairs in 3/4', () => {
    const bar = barOf(row(6, 2), { tick: 0, numerator: 3, denominator: 4 });
    expect(groupsOf(bar)).toEqual([
      [0, 1],
      [2, 3],
      [4, 5],
    ]);
  });

  it('joins eighths in threes in 6/8 and 12/8', () => {
    const six = barOf(row(6, 2), { tick: 0, numerator: 6, denominator: 8 });
    expect(groupsOf(six)).toEqual([
      [0, 1, 2],
      [3, 4, 5],
    ]);
    const twelve = barOf(row(12, 2), { tick: 0, numerator: 12, denominator: 8 });
    expect(groupsOf(twelve)).toHaveLength(4);
    expect(groupsOf(twelve).every((g) => g.length === 3)).toBe(true);
  });

  it('joins the whole bar in 3/8', () => {
    const bar = barOf(row(3, 2), { tick: 0, numerator: 3, denominator: 8 });
    expect(groupsOf(bar)).toEqual([[0, 1, 2]]);
  });

  it('joins four eighths to a half-note beat in 2/2', () => {
    const bar = barOf(row(8, 2), { tick: 0, numerator: 2, denominator: 2 });
    expect(groupsOf(bar)).toEqual([
      [0, 1, 2, 3],
      [4, 5, 6, 7],
    ]);
  });

  it('leaves the odd eighth of 5/8 alone', () => {
    const bar = barOf(row(5, 2), { tick: 0, numerator: 5, denominator: 8 });
    expect(groupsOf(bar)).toEqual([
      [0, 1],
      [2, 3],
    ]);
  });

  it('does not join across a rest', () => {
    // An eighth, a sixteenth rest, a sixteenth: all in one beat, nothing to join.
    const bar = barOf([
      [72, 0, 2],
      [72, 3, 4],
      [72, 4, 8],
      [72, 8, 12],
      [72, 12, 16],
    ]);
    expect(groupsOf(bar)).toEqual([]);
  });

  it('ends a group at a quarter note', () => {
    const bar = barOf([
      [72, 0, 2],
      [72, 2, 4],
      [72, 4, 8], // a quarter
      [72, 8, 10],
      [72, 10, 12],
      [72, 12, 16],
    ]);
    expect(groupsOf(bar)).toEqual([
      [0, 1],
      [3, 4],
    ]);
  });

  it('leaves a single eighth with its flag', () => {
    expect(groupsOf(barOf([[72, 0, 2]]))).toEqual([]);
  });

  it('never joins notes of different staves', () => {
    const bar = barOf([
      [72, 0, 2],
      [48, 2, 4], // the bass staff
    ]);
    expect(groupsOf(bar)).toEqual([]);
    expect(beamGroups(bar, 'bass')).toEqual([]);
  });

  it('treats a chord as one column', () => {
    const bar = barOf([
      [72, 0, 2],
      [76, 0, 2],
      [74, 2, 4],
    ]);
    expect(groupsOf(bar)).toEqual([[0, 1]]);
  });

  it('beams a tied eighth like any other', () => {
    // A quarter-and-eighth note (6 ticks) is cut in two columns that are tied.
    const bar = barOf([
      [72, 0, 6],
      [74, 6, 8],
    ]);
    const columns = bar.columns.treble;
    expect(columns[0].value).toBe('quarter');
    expect(groupsOf(bar)).toEqual([]);
    const tied = barOf([
      [72, 0, 2],
      [74, 2, 4],
      [72, 4, 6],
    ]);
    expect(groupsOf(tied)).toEqual([[0, 1]]);
  });
});

describe('beamGroups: second beams and hooks', () => {
  it('gives the sixteenth after a dotted eighth a hook pointing back', () => {
    const [group] = beamGroups(
      barOf([
        [72, 0, 3],
        [74, 3, 4],
      ]),
      'treble',
    );
    expect(group.columns).toEqual([0, 1]);
    expect(group.secondary).toEqual([]);
    expect(group.hooks).toEqual([{ at: 1, side: 'left' }]);
  });

  it('gives the sixteenth before a dotted eighth a hook pointing forward', () => {
    const [group] = beamGroups(
      barOf([
        [72, 0, 1],
        [74, 1, 4],
      ]),
      'treble',
    );
    expect(group.hooks).toEqual([{ at: 0, side: 'right' }]);
  });

  it('puts a second beam over two neighbouring sixteenths after an eighth', () => {
    const [group] = beamGroups(
      barOf([
        [72, 0, 2],
        [74, 2, 3],
        [72, 3, 4],
      ]),
      'treble',
    );
    expect(group.secondary).toEqual([{ from: 1, to: 2 }]);
    expect(group.hooks).toEqual([]);
  });

  it('handles two runs of sixteenths in one group', () => {
    const [group] = beamGroups(
      barOf([
        [72, 0, 1],
        [74, 1, 2],
        [72, 2, 4], // an eighth in the middle
        [74, 4, 5],
        [72, 5, 6],
        [74, 6, 8],
      ]),
      'treble',
    );
    // Beats: units 0–3 and 4–7 are separate groups in 4/4.
    expect(group.columns).toEqual([0, 1, 2]);
    expect(group.secondary).toEqual([{ from: 0, to: 1 }]);
  });
});

describe('beamGroups: stem direction', () => {
  it('points stems down for notes at or above the middle line and up below it', () => {
    const high = beamGroups(barOf(row(2, 2, 76)), 'treble')[0]; // E5
    const low = beamGroups(barOf(row(2, 2, 64)), 'treble')[0]; // E4
    expect(high.direction).toBe('down');
    expect(low.direction).toBe('up');
  });

  it('decides by the whole group, not by each note', () => {
    // E4 (low) and C6 (high): the average sits above the middle line.
    const [group] = beamGroups(
      barOf([
        [64, 0, 2],
        [84, 2, 4],
      ]),
      'treble',
    );
    expect(group.direction).toBe('down');
  });
});

describe('beamLine', () => {
  const heightsOk = (
    stems: { x: number; near: number }[],
    direction: 'up' | 'down',
    line: ReturnType<typeof beamLine>,
  ) => {
    const sign = direction === 'up' ? 1 : -1;
    for (const stem of stems) {
      const stemLength = sign * (heightAt(line, stem.x) - stem.near);
      expect(stemLength).toBeGreaterThanOrEqual(MIN_STEM_STEPS - 1e-9);
    }
    expect(Math.abs(line.h2 - line.h1)).toBeLessThanOrEqual(MAX_SLOPE_STEPS + 1e-9);
  };

  it('is flat over two notes at the same height, a minimum stem above them', () => {
    const stems = [
      { x: 0, near: 7 },
      { x: 10, near: 7 },
    ];
    const line = beamLine(stems, 'up');
    expect(line).toEqual({ x1: 0, x2: 10, h1: 7 + MIN_STEM_STEPS, h2: 7 + MIN_STEM_STEPS });
  });

  it('slopes with the melody but never more than one staff space', () => {
    const rising = [
      { x: 0, near: 2 },
      { x: 10, near: 9 },
    ];
    const line = beamLine(rising, 'up');
    expect(line.h2 - line.h1).toBe(MAX_SLOPE_STEPS);
    heightsOk(rising, 'up', line);

    const falling = [
      { x: 0, near: 9 },
      { x: 10, near: 2 },
    ];
    const down = beamLine(falling, 'up');
    expect(down.h1 - down.h2).toBe(MAX_SLOPE_STEPS);
    heightsOk(falling, 'up', down);
  });

  it('follows a small step in the melody exactly', () => {
    const stems = [
      { x: 0, near: 5 },
      { x: 10, near: 6 },
    ];
    const line = beamLine(stems, 'up');
    expect(line.h2 - line.h1).toBe(1);
  });

  it('moves up when a note in the middle is higher than the ends', () => {
    const stems = [
      { x: 0, near: 7 },
      { x: 10, near: 12 },
      { x: 20, near: 7 },
    ];
    const line = beamLine(stems, 'up');
    heightsOk(stems, 'up', line);
    expect(heightAt(line, 10) - 12).toBeCloseTo(MIN_STEM_STEPS);
  });

  it('is the mirror image for stems down', () => {
    const up = beamLine(
      [
        { x: 0, near: 7 },
        { x: 10, near: 9 },
      ],
      'up',
    );
    const down = beamLine(
      [
        { x: 0, near: -7 },
        { x: 10, near: -9 },
      ],
      'down',
    );
    expect(down.h1).toBeCloseTo(-up.h1);
    expect(down.h2).toBeCloseTo(-up.h2);
  });

  it('keeps every stem long enough, for many shapes and both directions', () => {
    let seed = 7;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let trial = 0; trial < 300; trial++) {
      const count = 2 + Math.floor(random() * 6);
      const stems = Array.from({ length: count }, (_, i) => ({
        x: i * 12,
        near: Math.round(random() * 24 - 12),
      }));
      for (const direction of ['up', 'down'] as const) {
        heightsOk(stems, direction, beamLine(stems, direction));
      }
    }
  });

  it('interpolates the height between the ends', () => {
    const line = { x1: 0, x2: 10, h1: 10, h2: 12 };
    expect(heightAt(line, 0)).toBe(10);
    expect(heightAt(line, 5)).toBe(11);
    expect(heightAt(line, 10)).toBe(12);
    expect(heightAt({ x1: 4, x2: 4, h1: 9, h2: 9 }, 4)).toBe(9);
  });
});

describe('beamGroups: two voices', () => {
  const twoVoices = (notes: [number, number, number, 2?][]): ScoreBar => {
    const piece: Piece = {
      ticksPerQuarter: 4,
      notes: notes.map(([note, startTick, endTick, voice]) => ({
        note,
        startTick,
        endTick,
        start: startTick * 0.125,
        end: endTick * 0.125,
        velocity: 80,
        ...(voice === 2 ? { voice: 2 as const } : {}),
      })),
      pedal: [],
      tempos: [{ tick: 0, time: 0, microsPerQuarter: 500_000 }],
      timeSignatures: [{ tick: 0, numerator: 4, denominator: 4 }],
      duration: 0,
    };
    return buildScore(piece).bars[0];
  };

  it('beams each voice on its own, with stems up for the upper and down for the lower', () => {
    const bar = twoVoices([
      [84, 0, 2],
      [84, 2, 4],
      [72, 0, 2, 2],
      [72, 2, 4, 2],
      [84, 4, 16],
      [72, 4, 16, 2],
    ]);
    const groups = beamGroups(bar, 'treble');
    expect(groups.map((g) => g.columns)).toEqual([
      [0, 2],
      [1, 3],
    ]);
    expect(groups.map((g) => g.direction)).toEqual(['up', 'down']);
    // A group only holds columns of one voice.
    for (const group of groups) {
      const voices = new Set(group.columns.map((i) => bar.columns.treble[i].voice));
      expect(voices.size).toBe(1);
    }
  });

  it('is not broken by a long note of the other voice', () => {
    const bar = twoVoices([
      [84, 0, 2],
      [84, 2, 4],
      [72, 0, 16, 2],
      [84, 4, 16],
    ]);
    const groups = beamGroups(bar, 'treble');
    expect(groups).toHaveLength(1);
    expect(groups[0].direction).toBe('up');
  });
});
