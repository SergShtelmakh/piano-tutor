// Pure: turns a parsed piece into a simplified score (bars, columns, rests, ties, sharps).
// Playback never uses it; it exists to be read. Drawing lives in `components/ScoreView.tsx`.
import { spell, keyAlterations, staffIndex } from './spelling.ts';
import { tickToSeconds, type NoteSpelling, type Piece } from './smf.ts';
import { positionAt, spellNote, type Clef } from './staff.ts';

/** Columns and bars are counted in sixteenth notes. */
export const UNITS_PER_QUARTER = 4;
const UNITS_PER_WHOLE = 16;

export type NoteValue = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth';

/** The lengths a note can be drawn with, in sixteenths, longest first. */
const VALUES: readonly { units: number; value: NoteValue; dots: 0 | 1 }[] = [
  { units: 16, value: 'whole', dots: 0 },
  { units: 12, value: 'half', dots: 1 },
  { units: 8, value: 'half', dots: 0 },
  { units: 6, value: 'quarter', dots: 1 },
  { units: 4, value: 'quarter', dots: 0 },
  { units: 3, value: 'eighth', dots: 1 },
  { units: 2, value: 'eighth', dots: 0 },
  { units: 1, value: 'sixteenth', dots: 0 },
];

export interface ScoreNote {
  note: number;
  /** Staff index, as in `StaffPosition`. */
  index: number;
  ledger: readonly number[];
  /** How the note is written: a flat, natural, or sharp (the key signature may already give it). */
  alter: -1 | 0 | 1;
  /** The sign drawn before the notehead, or null when the key or the bar already gives it. */
  accidental: 'sharp' | 'flat' | 'natural' | null;
  /** True for the upper note of a second, drawn to the right of the lower one. */
  shifted: boolean;
  /** Tied to the same note in the next column / from the previous column. */
  tieNext: boolean;
  tiePrev: boolean;
}

export interface Column {
  /** Start, in sixteenths from the start of the piece. */
  unit: number;
  units: number;
  /** Seconds (at 100 % tempo) of the rounded start and end. */
  time: number;
  endTime: number;
  value: NoteValue;
  dots: 0 | 1;
  rest: boolean;
  /** Lowest note first. Empty for a rest. */
  notes: ScoreNote[];
}

export interface TimeSignatureMark {
  numerator: number;
  denominator: number;
}

export interface ScoreBar {
  /** From 1. */
  number: number;
  startUnit: number;
  units: number;
  timeSignature: TimeSignatureMark;
  /** True for the first bar and where the time signature changes. */
  showTimeSignature: boolean;
  /** Sharps (positive) or flats (negative) of the key signature in this bar. */
  keySignature: number;
  /** True where the key signature changes (a system start draws its key anyway). */
  showKeySignature: boolean;
  startTime: number;
  endTime: number;
  columns: Record<Clef, Column[]>;
}

export interface ScoreExtents {
  /** The highest staff index on the treble staff (10 when it holds no note). */
  highIndex: number;
  /** The lowest staff index on the bass staff (−10 when it holds no note). */
  lowIndex: number;
  /**
   * Staff steps (half a line gap) from the bottom line of the treble staff to the top line of the
   * bass staff: at least 8 (four staff spaces), and more when notes written between the staves
   * would otherwise touch.
   */
  gapSteps: number;
}

export interface Score extends ScoreExtents {
  bars: ScoreBar[];
  /** Lowest and highest note of the piece. */
  low: number;
  high: number;
}

/** The bottom line of the treble staff and the top line of the bass staff, as staff indexes. */
const TREBLE_BOTTOM = 2;
const BASS_TOP = -2;
/** Four staff spaces between the staves; plain notation has two. */
export const MIN_GAP_STEPS = 8;

/** The vertical room a set of bars needs: its extremes and the space between the staves. */
export function measureBars(bars: readonly ScoreBar[]): ScoreExtents {
  let trebleLow = TREBLE_BOTTOM;
  let trebleHigh = 10;
  let bassLow = -10;
  let bassHigh = BASS_TOP;
  for (const bar of bars) {
    for (const column of bar.columns.treble) {
      for (const note of column.notes) {
        trebleLow = Math.min(trebleLow, note.index);
        trebleHigh = Math.max(trebleHigh, note.index);
      }
    }
    for (const column of bar.columns.bass) {
      for (const note of column.notes) {
        bassLow = Math.min(bassLow, note.index);
        bassHigh = Math.max(bassHigh, note.index);
      }
    }
  }
  return { highIndex: trebleHigh, lowIndex: bassLow, gapSteps: gapStepsFor(trebleLow, bassHigh) };
}

/**
 * The space between the staves for the lowest note on the treble staff and the highest on the
 * bass staff (staff indexes). With the notehead's own height they must keep a staff space apart;
 * the bass staff moves down by whatever that takes beyond the minimum.
 */
export function gapStepsFor(trebleLow: number, bassHigh: number): number {
  return Math.max(MIN_GAP_STEPS, MIN_GAP_STEPS + bassHigh - Math.min(trebleLow, TREBLE_BOTTOM));
}

interface QuantisedNote {
  note: number;
  spelling?: NoteSpelling;
  start: number;
  end: number;
  /** The staff the note is drawn on. */
  clef: Clef;
}

/** A note with a hand goes on that hand's staff; otherwise the middle-C split decides. */
const CLEF_OF_HAND = { right: 'treble', left: 'bass' } as const;

/** A stretch of one staff that is either a chord or a rest, before it is cut at bar lines. */
interface Span {
  start: number;
  end: number;
  notes: { note: number; spelling?: NoteSpelling }[];
}

/** The key signature in effect at a position, in sixteenths. */
function keyAt(piece: Piece, unitTicks: number, unit: number): number {
  const keys = piece.keySignatures ?? [];
  let fifths = 0;
  for (const key of keys) {
    if (Math.round(key.tick / unitTicks) <= unit) fifths = key.fifths;
  }
  return fifths;
}

function splitIntoValues(units: number): { units: number; value: NoteValue; dots: 0 | 1 }[] {
  const parts: { units: number; value: NoteValue; dots: 0 | 1 }[] = [];
  let left = units;
  while (left > 0) {
    const part = VALUES.find((candidate) => candidate.units <= left)!;
    parts.push(part);
    left -= part.units;
  }
  return parts;
}

function buildBars(
  piece: Piece,
  unitTicks: number,
  totalUnits: number,
): Omit<ScoreBar, 'columns' | 'startTime' | 'endTime'>[] {
  const signatures = piece.timeSignatures;
  const bars: Omit<ScoreBar, 'columns' | 'startTime' | 'endTime'>[] = [];
  let signature = 0;
  let unit = 0;
  while (unit < totalUnits) {
    while (
      signature + 1 < signatures.length &&
      Math.round(signatures[signature + 1].tick / unitTicks) <= unit
    ) {
      signature++;
    }
    const { numerator, denominator } = signatures[signature];
    const units = Math.max(1, Math.round((UNITS_PER_WHOLE * numerator) / denominator));
    const previous = bars[bars.length - 1]?.timeSignature;
    const keySignature = keyAt(piece, unitTicks, unit);
    bars.push({
      number: bars.length + 1,
      startUnit: unit,
      units,
      timeSignature: { numerator, denominator },
      showTimeSignature:
        !previous || previous.numerator !== numerator || previous.denominator !== denominator,
      keySignature,
      showKeySignature: bars.length === 0 || keySignature !== bars[bars.length - 1].keySignature,
    });
    unit += units;
  }
  return bars;
}

/** One voice per staff: each chord lasts until the next one starts (or for its own length). */
function spansOf(notes: readonly QuantisedNote[], endUnit: number): Span[] {
  const byStart = new Map<number, QuantisedNote[]>();
  for (const note of notes) {
    const group = byStart.get(note.start);
    if (group) group.push(note);
    else byStart.set(note.start, [note]);
  }
  const onsets = [...byStart.keys()].sort((a, b) => a - b);

  const spans: Span[] = [];
  let cursor = 0;
  onsets.forEach((onset, i) => {
    const group = byStart.get(onset)!;
    const longest = Math.max(...group.map((note) => note.end));
    const end = Math.min(onsets[i + 1] ?? Infinity, longest);
    if (onset > cursor) spans.push({ start: cursor, end: onset, notes: [] });
    // One entry per pitch; the first spelling given for a pitch is kept.
    const pitches = new Map<number, { note: number; spelling?: NoteSpelling }>();
    for (const note of group) {
      if (!pitches.has(note.note)) {
        pitches.set(note.note, {
          note: note.note,
          ...(note.spelling ? { spelling: note.spelling } : {}),
        });
      }
    }
    spans.push({ start: onset, end, notes: [...pitches.values()] });
    cursor = end;
  });
  if (cursor < endUnit) spans.push({ start: cursor, end: endUnit, notes: [] });
  return spans;
}

/** Builds the score of a piece. Starts and ends are rounded to the nearest sixteenth note. */
export function buildScore(piece: Piece): Score {
  const unitTicks = piece.ticksPerQuarter / UNITS_PER_QUARTER;
  const quantised: QuantisedNote[] = piece.notes.map((note) => {
    const start = Math.round(note.startTick / unitTicks);
    return {
      note: note.note,
      ...(note.spelling ? { spelling: note.spelling } : {}),
      start,
      end: Math.max(start + 1, Math.round(note.endTick / unitTicks)),
      clef: note.hand ? CLEF_OF_HAND[note.hand] : spellNote(note.note).position.clef,
    };
  });
  const totalUnits = Math.max(...quantised.map((note) => note.end));
  const timeOf = (unit: number) =>
    tickToSeconds(piece.tempos, piece.ticksPerQuarter, unit * unitTicks);

  const bars: ScoreBar[] = buildBars(piece, unitTicks, totalUnits).map((bar) => ({
    ...bar,
    startTime: timeOf(bar.startUnit),
    endTime: timeOf(bar.startUnit + bar.units),
    columns: { treble: [], bass: [] },
  }));
  const endUnit = bars[bars.length - 1].startUnit + bars[bars.length - 1].units;

  for (const clef of ['treble', 'bass'] as const) {
    const staffNotes = quantised.filter((note) => note.clef === clef);
    let barIndex = 0;

    for (const span of spansOf(staffNotes, endUnit)) {
      // Cut the span at bar lines, then into drawable lengths; the pieces of a note are tied.
      const cuts: { bar: ScoreBar; unit: number; units: number; value: NoteValue; dots: 0 | 1 }[] =
        [];
      for (let pos = span.start; pos < span.end;) {
        while (bars[barIndex].startUnit + bars[barIndex].units <= pos) barIndex++;
        const bar = bars[barIndex];
        const stop = Math.min(span.end, bar.startUnit + bar.units);
        if (span.notes.length === 0 && pos === bar.startUnit && stop - pos === bar.units) {
          // A rest for a whole bar is a whole rest, whatever the metre.
          cuts.push({ bar, unit: pos, units: bar.units, value: 'whole', dots: 0 });
        } else {
          let at = pos;
          for (const part of splitIntoValues(stop - pos)) {
            cuts.push({ bar, unit: at, ...part });
            at += part.units;
          }
        }
        pos = stop;
      }

      cuts.forEach((cut, i) => {
        const notes = [...span.notes]
          .sort((a, b) => a.note - b.note)
          .map(({ note, spelling }): ScoreNote => {
            // Written as the file says, else by the key of this bar (flats in a flat key).
            const written = spell(note, cut.bar.keySignature, spelling);
            const position = positionAt(staffIndex(written.step, written.octave), clef);
            return {
              note,
              index: position.index,
              ledger: position.ledger,
              alter: written.alter,
              accidental: null,
              shifted: false,
              tieNext: i < cuts.length - 1,
              tiePrev: i > 0,
            };
          });
        notes.forEach((note, j) => {
          const below = notes[j - 1];
          note.shifted = below !== undefined && note.index - below.index <= 1 && !below.shifted;
        });
        cut.bar.columns[clef].push({
          unit: cut.unit,
          units: cut.units,
          time: timeOf(cut.unit),
          endTime: timeOf(cut.unit + cut.units),
          value: cut.value,
          dots: cut.dots,
          rest: span.notes.length === 0,
          notes,
        });
      });
    }

    // Accidentals: each staff position starts every bar with the alteration of the key signature;
    // a sign is drawn when a note differs from it (a sharp, a flat, or a natural), and then holds
    // for the rest of the bar. A note tied from the previous column repeats nothing.
    for (const bar of bars) {
      const keyAlter = keyAlterations(bar.keySignature);
      const state = new Map<number, number>();
      for (const column of bar.columns[clef]) {
        for (const note of column.notes) {
          const current = state.get(note.index) ?? keyAlter[((note.index % 7) + 7) % 7];
          if (note.alter !== current) {
            if (!note.tiePrev) {
              note.accidental = note.alter > 0 ? 'sharp' : note.alter < 0 ? 'flat' : 'natural';
            }
            state.set(note.index, note.alter);
          }
        }
      }
    }
  }

  return {
    bars,
    low: Math.min(...piece.notes.map((note) => note.note)),
    high: Math.max(...piece.notes.map((note) => note.note)),
    ...measureBars(bars),
  };
}

/** The middle line of a staff, as a staff index. */
export const MIDDLE_LINE: Record<Clef, number> = { treble: 6, bass: -6 };

/** Stems point down when the notes sit at or above the middle line on average, otherwise up. */
export function stemDirection(notes: readonly ScoreNote[], clef: Clef): 'up' | 'down' {
  if (notes.length === 0) return 'up';
  const indices = notes.map((note) => note.index);
  const middle = (Math.min(...indices) + Math.max(...indices)) / 2;
  return middle >= MIDDLE_LINE[clef] ? 'down' : 'up';
}
