// Pure: where the steps of one page sit on the grand staff. Drawing lives in `components/StaffView.tsx`.
import { MAX_PAGE_STEPS } from './lessons.ts';
import { staffPosition, type Clef } from './staff.ts';

/** SVG units. The row has room for a full page, so the scale stays the same from page to page. */
export const ROW_LEFT = 10;
/** x of the first step; the clefs sit to the left of it. */
export const FIRST_STEP_X = 56;
export const STEP_SPACING = 30;
export const ROW_WIDTH = FIRST_STEP_X + (MAX_PAGE_STEPS - 1) * STEP_SPACING + 22;
export const ROW_RIGHT = ROW_WIDTH - 10;
/** How far the upper notehead of a second moves to the right: one notehead width. */
export const SECOND_SHIFT = 14;

export interface RowNote {
  note: number;
  clef: Clef;
  /** Staff index, as in `StaffPosition`. */
  index: number;
  /** True for the upper note of a second, drawn to the right of the lower one. */
  shifted: boolean;
}

export interface RowStep {
  /** x of the step's noteheads (before `shifted` ones move right). */
  x: number;
  /** The step's notes, lowest first. */
  notes: readonly RowNote[];
  /** Indices of the ledger lines of all notes of the step, ascending, without duplicates. */
  ledger: readonly number[];
}

export interface StaffRow {
  width: number;
  steps: readonly RowStep[];
}

function rowStep(step: readonly number[], slot: number): RowStep {
  const placed = [...step]
    .sort((a, b) => a - b)
    .flatMap((note) => {
      const position = staffPosition(note);
      return position ? [{ note, position }] : [];
    });

  const notes: RowNote[] = [];
  const ledger = new Set<number>();
  for (const { note, position } of placed) {
    const below = notes[notes.length - 1];
    // Notes on neighbouring staff positions would overlap, so the upper one moves aside, unless
    // the one under it has moved already (then it is clear).
    const shifted = below !== undefined && position.index - below.index === 1 && !below.shifted;
    notes.push({ note, clef: position.clef, index: position.index, shifted });
    for (const index of position.ledger) ledger.add(index);
  }

  return {
    x: FIRST_STEP_X + slot * STEP_SPACING,
    notes,
    ledger: [...ledger].sort((a, b) => a - b),
  };
}

/** Lays out one page of steps from left to right. At most `MAX_PAGE_STEPS` fit; more are cut off. */
export function staffRow(steps: readonly (readonly number[])[]): StaffRow {
  return {
    width: ROW_WIDTH,
    steps: steps.slice(0, MAX_PAGE_STEPS).map((step, slot) => rowStep(step, slot)),
  };
}
