// Pure: which eighth and sixteenth notes are joined by beams, and where the beam runs. Drawing
// lives in `components/ScoreView.tsx`. Heights are staff indexes (half a staff space per step).
import { stemDirection, type Column, type ScoreBar, type TimeSignatureMark } from './score.ts';
import type { Clef } from './staff.ts';

/** The shortest stem, from the notehead nearest the beam to the beam: three and a half spaces. */
export const MIN_STEM_STEPS = 7;
/** A beam rises or falls at most one staff space over its whole length. */
export const MAX_SLOPE_STEPS = 2;

/**
 * The length of a beat in sixteenths: a quarter in x/4, a half in x/2, a dotted quarter in 6/8,
 * 9/8, and 12/8, the whole bar in 3/8, and a quarter in the other x/8 and x/16 metres.
 */
export function beatUnits({ numerator, denominator }: TimeSignatureMark): number {
  if (denominator === 1) return 16;
  if (denominator === 2) return 8;
  if (denominator === 8 && [3, 6, 9, 12].includes(numerator)) return 6;
  return 4;
}

export interface BeamGroup {
  /** Indexes into `bar.columns[clef]`, left to right; at least two. */
  columns: number[];
  direction: 'up' | 'down';
  /** Second beams: runs of neighbouring sixteenths, as positions inside `columns`. */
  secondary: { from: number; to: number }[];
  /** A sixteenth with no sixteenth beside it gets a short second beam towards its neighbour. */
  hooks: { at: number; side: 'left' | 'right' }[];
}

const beamable = (column: Column) =>
  !column.rest && (column.value === 'eighth' || column.value === 'sixteenth');

function groupDetails(columns: readonly Column[], indexes: number[], clef: Clef): BeamGroup {
  const members = indexes.map((i) => columns[i]);
  const isSixteenth = members.map((column) => column.value === 'sixteenth');

  const secondary: BeamGroup['secondary'] = [];
  const hooks: BeamGroup['hooks'] = [];
  let at = 0;
  while (at < members.length) {
    if (!isSixteenth[at]) {
      at++;
      continue;
    }
    let to = at;
    while (to + 1 < members.length && isSixteenth[to + 1]) to++;
    if (to > at) secondary.push({ from: at, to });
    else hooks.push({ at, side: at === 0 ? 'right' : 'left' });
    at = to + 1;
  }

  return {
    columns: indexes,
    // A voice of a two-voice bar has its stem direction fixed; otherwise it follows the notes.
    direction:
      members[0].stem ??
      stemDirection(
        members.flatMap((column) => column.notes),
        clef,
      ),
    secondary,
    hooks,
  };
}

/**
 * The beam groups of one staff of one bar: runs of neighbouring eighth and sixteenth columns
 * (a chord is one column) that start in the same beat. A rest, a longer note, or the bar line ends
 * a group; a tie does not. A single short note is not a group and keeps its flag.
 */
export function beamGroups(bar: ScoreBar, clef: Clef): BeamGroup[] {
  const columns = bar.columns[clef];
  const beat = beatUnits(bar.timeSignature);
  const beatOf = (column: Column) => Math.floor((column.unit - bar.startUnit) / beat);

  const groups: BeamGroup[] = [];
  // Each voice of the staff is beamed on its own: a group never joins notes of two voices.
  for (const voice of [1, 2] as const) {
    let current: number[] = [];
    const flush = () => {
      if (current.length >= 2) groups.push(groupDetails(columns, current, clef));
      current = [];
    };
    columns.forEach((column, i) => {
      if (column.voice !== voice) return;
      if (!beamable(column)) {
        flush();
        return;
      }
      if (current.length > 0 && beatOf(columns[current[0]]) !== beatOf(column)) flush();
      current.push(i);
    });
    flush();
  }
  groups.sort((a, b) => a.columns[0] - b.columns[0]);
  return groups;
}

/** One stem of a group: where it stands, and the notes at both ends of it (staff indexes). */
export interface BeamStem {
  x: number;
  /** The note nearest the beam: the highest of the column for stems up, the lowest for down. */
  near: number;
}

export interface BeamLine {
  x1: number;
  x2: number;
  /** Height of the beam (staff index) above the first and the last stem. */
  h1: number;
  h2: number;
}

/**
 * The line of the primary beam over the stems of a group. It runs from the nearest note of the
 * first stem to that of the last one, a minimum stem away from them, with its slope limited to one
 * staff space; then it moves away from the notes until every stem is at least a minimum stem long.
 */
export function beamLine(stems: readonly BeamStem[], direction: 'up' | 'down'): BeamLine {
  const sign = direction === 'up' ? 1 : -1;
  // Work as if stems pointed up: a height is larger the farther it is from the notes.
  const near = stems.map((stem) => sign * stem.near);
  const first = stems[0];
  const last = stems[stems.length - 1];

  let h1 = near[0] + MIN_STEM_STEPS;
  let h2 = near[near.length - 1] + MIN_STEM_STEPS;
  if (h2 - h1 > MAX_SLOPE_STEPS) h1 = h2 - MAX_SLOPE_STEPS; // raise the low end, never the notes
  if (h1 - h2 > MAX_SLOPE_STEPS) h2 = h1 - MAX_SLOPE_STEPS;

  const span = last.x - first.x;
  const at = (x: number) => (span === 0 ? h1 : h1 + ((h2 - h1) * (x - first.x)) / span);
  const shift = Math.max(0, ...stems.map((stem, i) => near[i] + MIN_STEM_STEPS - at(stem.x)));
  return { x1: first.x, x2: last.x, h1: sign * (h1 + shift), h2: sign * (h2 + shift) };
}

/** The height of a beam line (staff index) at an x between its ends. */
export function heightAt(line: BeamLine, x: number): number {
  const span = line.x2 - line.x1;
  return span === 0 ? line.h1 : line.h1 + ((line.h2 - line.h1) * (x - line.x1)) / span;
}
