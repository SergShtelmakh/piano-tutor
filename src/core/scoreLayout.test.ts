import { describe, expect, it } from 'vitest';
import { buildScore } from './score.ts';
import {
  CLEF_WIDTH,
  KEY_PAD,
  columnX,
  keyWidth,
  layoutSystems,
  systemIndexAtTime,
  timeAtX,
  visibleSystems,
  xAtTime,
} from './scoreLayout.ts';
import type { Piece } from './smf.ts';

// One tick is one sixteenth note (4 ticks per quarter) at 120 bpm: 0.125 s each.
function makePiece(notes: [note: number, start: number, end: number][]): Piece {
  return {
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
    timeSignatures: [{ tick: 0, numerator: 4, denominator: 4 }],
    duration: 0,
  };
}

/** `count` bars of four quarter notes (C4 D4 E4 F4). */
function quarters(count: number): Piece {
  const notes: [number, number, number][] = [];
  for (let i = 0; i < count * 4; i++) notes.push([[60, 62, 64, 65][i % 4], i * 4, i * 4 + 4]);
  return makePiece(notes);
}

describe('layoutSystems', () => {
  it('fits as many bars as the width allows and wraps the rest', () => {
    const score = buildScore(quarters(8));
    const wide = layoutSystems(score, 1200);
    const narrow = layoutSystems(score, 330);
    expect(wide.systems.length).toBeLessThan(narrow.systems.length);
    const count = (layout: typeof wide) => layout.systems.flatMap((s) => s.bars).length;
    expect(count(wide)).toBe(8);
    expect(count(narrow)).toBe(8);
    expect(wide.systems.every((system) => system.bars.length > 0)).toBe(true);
  });

  it('keeps bars in order, with bar numbers continuing across systems', () => {
    const layout = layoutSystems(buildScore(quarters(8)), 400);
    const numbers = layout.systems.flatMap((system) => system.bars.map((b) => b.bar.number));
    expect(numbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('stretches every system but the last to the available width', () => {
    const layout = layoutSystems(buildScore(quarters(8)), 400);
    layout.systems.slice(0, -1).forEach((system) => {
      expect(system.width).toBeCloseTo(400, 3);
    });
    expect(layout.systems[layout.systems.length - 1].width).toBeLessThanOrEqual(400 + 1e-6);
  });

  it('puts the bars side by side without overlap, after the clefs', () => {
    const layout = layoutSystems(buildScore(quarters(4)), 600);
    for (const system of layout.systems) {
      expect(system.bars[0].x).toBe(CLEF_WIDTH);
      system.bars.slice(1).forEach((bar, i) => {
        const before = system.bars[i];
        expect(bar.x).toBeCloseTo(before.x + before.width);
      });
    }
  });

  it('keeps note positions strictly increasing inside a system', () => {
    const layout = layoutSystems(buildScore(quarters(6)), 500);
    for (const system of layout.systems) {
      const xs = system.bars.flatMap((bar) => bar.slots.map((slot) => slot.x));
      expect(xs.every((x, i) => i === 0 || x > xs[i - 1])).toBe(true);
    }
  });

  it('lets a single over-wide bar have a system of its own, as wide as it needs', () => {
    // Sixteen sixteenth notes in one bar are far wider than 200 units.
    const notes: [number, number, number][] = Array.from({ length: 16 }, (_, i) => [60, i, i + 1]);
    const layout = layoutSystems(buildScore(makePiece(notes)), 200);
    expect(layout.systems).toHaveLength(1);
    expect(layout.systems[0].width).toBeGreaterThan(200);
  });

  it('gives a sharp extra room', () => {
    const plain = layoutSystems(buildScore(makePiece([[60, 0, 4]])), 600).systems[0].bars[0];
    const sharp = layoutSystems(buildScore(makePiece([[61, 0, 4]])), 600).systems[0].bars[0];
    // The sharp sits left of the notehead, so the notehead is further from the bar line.
    expect(sharp.slots[0].x).toBeGreaterThan(plain.slots[0].x);
  });

  it('aligns the notes of both staves on the same x', () => {
    const layout = layoutSystems(
      buildScore(
        makePiece([
          [60, 0, 4],
          [48, 0, 4],
        ]),
      ),
      600,
    );
    const bar = layout.systems[0].bars[0];
    const [treble] = bar.bar.columns.treble;
    const [bass] = bar.bar.columns.bass;
    expect(columnX(bar, treble)).toBe(columnX(bar, bass));
  });

  it('centres a whole-bar rest in its bar', () => {
    // Only the treble staff plays, so the bass staff has a whole rest in each bar.
    const layout = layoutSystems(buildScore(quarters(1)), 600);
    const bar = layout.systems[0].bars[0];
    const rest = bar.bar.columns.bass[0];
    expect(rest.rest).toBe(true);
    const x = columnX(bar, rest);
    expect(x).toBeGreaterThan(bar.slots[0].x);
    expect(x).toBeLessThan(bar.x + bar.width);
  });

  it('starts a piece with a silent bar', () => {
    const layout = layoutSystems(buildScore(makePiece([[60, 16, 20]])), 600);
    expect(layout.systems.flatMap((s) => s.bars)).toHaveLength(2);
    expect(layout.systems[0].bars[0].slots.length).toBeGreaterThan(0);
  });
});

describe('cursor map', () => {
  const layout = layoutSystems(buildScore(quarters(6)), 500);
  const system = layout.systems[0];

  it('starts at the first note and never moves left', () => {
    expect(xAtTime(system, system.startTime)).toBe(system.bars[0].slots[0].x);
    let previous = -Infinity;
    for (let t = system.startTime; t <= system.endTime; t += 0.05) {
      const x = xAtTime(system, t);
      expect(x).toBeGreaterThanOrEqual(previous);
      previous = x;
    }
  });

  it('interpolates between two notes', () => {
    const [first, second] = system.bars[0].slots;
    const middle = (first.time + second.time) / 2;
    expect(xAtTime(system, middle)).toBeCloseTo((first.x + second.x) / 2);
  });

  it('is at the first note position of a slot at its time', () => {
    const slot = system.bars[1].slots[2];
    expect(xAtTime(system, slot.time)).toBeCloseTo(slot.x);
  });

  it('stays inside the system at the end', () => {
    const x = xAtTime(system, system.endTime + 5);
    expect(x).toBeLessThanOrEqual(system.width);
  });

  it('snaps a click to the nearest note position', () => {
    const slot = system.bars[1].slots[1];
    expect(timeAtX(system, slot.x + 2)).toBe(slot.time);
    expect(timeAtX(system, slot.x - 2)).toBe(slot.time);
  });

  it('snaps a click left of everything to the first note and right of everything to the last', () => {
    const first = system.bars[0].slots[0];
    const lastBar = system.bars[system.bars.length - 1];
    const last = lastBar.slots[lastBar.slots.length - 1];
    expect(timeAtX(system, -50)).toBe(first.time);
    expect(timeAtX(system, system.width + 50)).toBe(last.time);
  });
});

describe('visible systems', () => {
  const layout = layoutSystems(buildScore(quarters(12)), 330);

  it('shows the current system and the next one', () => {
    expect(layout.systems.length).toBeGreaterThan(3);
    expect(visibleSystems(layout, 0)).toEqual([0, 1]);
    const second = layout.systems[1].startTime;
    expect(systemIndexAtTime(layout, second)).toBe(1);
    expect(visibleSystems(layout, second)).toEqual([1, 2]);
  });

  it('advances as soon as the cursor enters the next system', () => {
    const boundary = layout.systems[1].startTime;
    expect(systemIndexAtTime(layout, boundary - 0.001)).toBe(0);
    expect(systemIndexAtTime(layout, boundary)).toBe(1);
  });

  it('shows only the last system at the end', () => {
    const last = layout.systems.length - 1;
    expect(visibleSystems(layout, 1e6)).toEqual([last]);
  });
});

describe('layoutSystems: key signatures', () => {
  const withKeys = (count: number, keys: { tick: number; fifths: number }[]): Piece => ({
    ...quarters(count),
    keySignatures: keys,
  });

  it('gives a key signature no width in C major, and a width per sign otherwise', () => {
    expect(keyWidth(0)).toBe(0);
    expect(keyWidth(5)).toBeGreaterThan(keyWidth(2));
    expect(keyWidth(-5)).toBe(keyWidth(5));
    expect(keyWidth(9)).toBe(keyWidth(7)); // never more than seven signs
  });

  it('starts every system with the clef and the key, and the first bar after them', () => {
    const score = buildScore(withKeys(8, [{ tick: 0, fifths: -3 }]));
    const layout = layoutSystems(score, 400);
    expect(layout.systems.length).toBeGreaterThan(1);
    for (const system of layout.systems) {
      expect(system.bars[0].x).toBe(CLEF_WIDTH + keyWidth(-3));
      expect(system.bars[0].keyX).toBe(CLEF_WIDTH + KEY_PAD);
      // The first notes start after the signature.
      expect(system.bars[0].slots[0].x).toBeGreaterThan(system.bars[0].x);
    }
  });

  it('is the same as before in C major: no key space, no key x', () => {
    const layout = layoutSystems(buildScore(quarters(4)), 600);
    expect(layout.systems[0].bars[0].x).toBe(CLEF_WIDTH);
    expect(layout.systems.flatMap((s) => s.bars).every((b) => b.keyX === null)).toBe(true);
  });

  it('draws a key change inside a system at the start of its bar, and makes room for it', () => {
    const plain = layoutSystems(buildScore(quarters(2)), 1200).systems[0];
    const changed = layoutSystems(
      buildScore(
        withKeys(2, [
          { tick: 0, fifths: 0 },
          { tick: 16, fifths: 2 },
        ]),
      ),
      1200,
    ).systems[0];
    expect(changed.bars[0].keyX).toBeNull();
    expect(changed.bars[1].keyX).not.toBeNull();
    expect(changed.bars[1].keyRoom).toBe(keyWidth(2));
    expect(changed.bars[1].slots[0].x).toBeGreaterThan(changed.bars[1].keyX! + 2 * 9);
    expect(changed.bars[1].slots[0].x - changed.bars[1].x).toBeGreaterThan(
      plain.bars[1].slots[0].x - plain.bars[1].x,
    );
  });

  it('does not count a key change at a system start twice', () => {
    // 8 bars in C, then a change to 3 flats at bar 5: bar 5 starts a system at a narrow width.
    const score = buildScore(
      withKeys(8, [
        { tick: 0, fifths: 0 },
        { tick: 64, fifths: -3 },
      ]),
    );
    const layout = layoutSystems(score, 330);
    const starts = layout.systems.find((system) => system.bars[0].bar.number === 5);
    if (starts) {
      expect(starts.bars[0].keyRoom).toBe(0);
      expect(starts.bars[0].x).toBe(CLEF_WIDTH + keyWidth(-3));
    }
    // Every bar after the change shows the new key at its system start or at the change itself.
    for (const system of layout.systems) {
      const first = system.bars[0];
      expect(first.keyX === null).toBe(first.bar.keySignature === 0);
    }
  });
});
