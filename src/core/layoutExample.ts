// Pure: the passage the layout editor plays, silently, so the learner sees how the staff and the
// piano will look in a lesson. It is made in code like a piece (a melody in the right hand, long
// notes in the left) and goes through the same score builder as a library piece.
import { stepsOf } from './course.ts';
import type { LessonNotation } from './lesson.ts';
import { buildScore } from './score.ts';
import type { Piece, PieceNote } from './smf.ts';

const TICKS_PER_QUARTER = 480;
const QUARTER_SECONDS = 0.5; // 120 bpm

// Ode to Joy in C major (E E F G G F E D C C D E E. D D–), then a second phrase; quarter notes.
const MELODY = [
  64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64, 64, 62, 62, 62, 64, 64, 65, 67, 67, 65, 64, 62,
  60, 60, 62, 64, 62, 60, 60, 60, 62, 62, 64, 60, 62, 64, 65, 60, 62, 64, 65, 64, 62, 60, 62, 55,
  64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64, 62, 60, 60, 60, 64, 64, 65, 67, 67, 65, 64, 62,
  60, 60, 62, 64, 62, 60, 60, 60,
];
// Half notes under it, two to a bar.
const BASS = [
  48, 43, 48, 43, 48, 43, 48, 43, 53, 48, 53, 48, 48, 43, 48, 43, 53, 48, 53, 48, 55, 48, 55, 43,
  48, 43, 48, 43, 53, 48, 48, 43, 48, 43, 48, 43, 53, 48, 48, 43,
];

function note(pitch: number, quarter: number, quarters: number): PieceNote {
  return {
    note: pitch,
    startTick: quarter * TICKS_PER_QUARTER,
    endTick: (quarter + quarters) * TICKS_PER_QUARTER,
    start: quarter * QUARTER_SECONDS,
    end: (quarter + quarters) * QUARTER_SECONDS,
    velocity: 80,
  };
}

function examplePiece(): Piece {
  const notes = [
    ...MELODY.map((pitch, i) => note(pitch, i, 1)),
    ...BASS.map((pitch, i) => note(pitch, i * 2, 2)),
  ].sort((a, b) => a.startTick - b.startTick || a.note - b.note);
  return {
    ticksPerQuarter: TICKS_PER_QUARTER,
    notes,
    pedal: [],
    tempos: [{ tick: 0, time: 0, microsPerQuarter: 500_000 }],
    timeSignatures: [{ tick: 0, numerator: 4, denominator: 4 }],
    keySignatures: [{ tick: 0, fifths: 0 }],
    duration: MELODY.length * QUARTER_SECONDS,
  };
}

/**
 * The moment of the example the editor holds still (a step from the start): both hands play, so
 * the cursor, the lit keys, and the hint ring show on both staves.
 */
export const EXAMPLE_STEP = 4;

export interface LayoutExample {
  /** What `NotationView` draws, with the time of each step. */
  notation: LessonNotation;
  /** The notes of each step, lowest first. */
  steps: readonly (readonly number[])[];
  /** The lowest and highest note: the piano is centred on them. */
  range: { low: number; high: number };
}

/** The example, built once (the passage never changes). */
export function layoutExample(): LayoutExample {
  const score = buildScore(examplePiece());
  const steps = stepsOf(score.bars, 'both');
  return {
    notation: { score, stepTimes: steps.map((step) => step.time) },
    steps: steps.map((step) => step.notes),
    range: { low: score.low, high: score.high },
  };
}
