import { describe, expect, it } from 'vitest';
import { buildSchedule } from './playback.ts';
import { buildScore } from './score.ts';
import { layoutSystems, systemIndexAtTime, xAtTime } from './scoreLayout.ts';
import { parseMidiFile } from './smf.ts';
import { ev, midiFile, track } from './smfTestHelpers.ts';

// A little two-hand piece in 3/4 with a tempo change, a sharp, a chord, and the pedal.
function sample() {
  const right = track([
    ev.timeSignature(0, 3, 2),
    ev.noteOn(0, 0, 64),
    ev.noteOff(480, 0, 64),
    ev.noteOn(0, 0, 66), // F♯4
    ev.noteOff(480, 0, 66),
    ev.noteOn(0, 0, 67),
    ev.noteOn(0, 0, 71),
    ev.noteOff(480, 0, 67),
    ev.noteOff(0, 0, 71),
    ev.noteOn(480, 0, 72), // starts half-way into the second bar
    ev.noteOff(1440, 0, 72), // and is held over the bar line
  ]);
  const left = track([
    ev.tempo(960, 400_000),
    ev.pedal(0, 1, 127),
    ev.noteOn(0, 1, 48),
    ev.noteOff(1440, 1, 48),
    ev.noteOn(0, 1, 43),
    ev.noteOff(1440, 1, 43),
    ev.pedal(0, 1, 0),
  ]);
  return midiFile([right, left]);
}

describe('from file bytes to a playable, readable piece', () => {
  const result = parseMidiFile(sample());
  if (!result.ok) throw new Error(result.error);
  const { piece } = result;
  const score = buildScore(piece);

  it('keeps the note range of the file', () => {
    expect([score.low, score.high]).toEqual([43, 72]);
  });

  it('fills whole 3/4 bars on both staves', () => {
    expect(score.bars.every((bar) => bar.units === 12)).toBe(true);
    for (const bar of score.bars) {
      for (const clef of ['treble', 'bass'] as const) {
        const total = bar.columns[clef].reduce((sum, column) => sum + column.units, 0);
        expect(total).toBe(bar.units);
      }
    }
  });

  it('draws the F♯ with a sharp and the long note tied across the bar line', () => {
    const treble = score.bars.flatMap((bar) => bar.columns.treble).filter((c) => !c.rest);
    expect(treble.some((c) => c.notes.some((n) => n.note === 66 && n.accidental === 'sharp'))).toBe(
      true,
    );
    expect(treble.some((c) => c.notes.some((n) => n.tieNext))).toBe(true);
  });

  it('lays every bar out at every width, and the cursor crosses each system left to right', () => {
    for (const width of [300, 360, 700, 1400]) {
      const layout = layoutSystems(score, width);
      expect(layout.systems.flatMap((s) => s.bars)).toHaveLength(score.bars.length);
      layout.systems.forEach((system, i) => {
        const start = xAtTime(system, system.startTime);
        const end = xAtTime(system, system.endTime);
        expect(end).toBeGreaterThan(start);
        expect(systemIndexAtTime(layout, system.startTime)).toBe(i);
      });
    }
  });

  it('plays what the file says, at the file times', () => {
    const schedule = buildSchedule(piece);
    const ons = schedule.filter((e) => e.type === 'noteon');
    expect(ons).toHaveLength(piece.notes.length);
    // The second bar starts at 1440 ticks: 960 at 120 bpm (1 s) + 480 at 150 bpm (0.4 s).
    const pedalDown = schedule.find((e) => e.type === 'sustain' && e.on);
    expect(pedalDown?.time).toBeCloseTo(1);
    expect(schedule.map((e) => e.time)).toEqual(
      [...schedule.map((e) => e.time)].sort((a, b) => a - b),
    );
  });
});
