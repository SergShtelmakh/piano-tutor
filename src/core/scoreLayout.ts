// Pure: where the bars of a score sit when they are wrapped into systems, and how playback time
// maps to x for the cursor. Drawing lives in `components/ScoreView.tsx`. Units are SVG units
// (the same scale as the lesson staff: a staff space is 10).
import type { Column, Score, ScoreBar } from './score.ts';

/** Room for the clefs at the start of every system. */
export const CLEF_WIDTH = 46;
export const TIME_SIGNATURE_WIDTH = 24;
/** Width of one sign of a key signature, and the air before and after the whole signature. */
export const KEY_SIGN_WIDTH = 9;
export const KEY_PAD = 4;
export const BAR_PAD_LEFT = 8;
export const BAR_PAD_RIGHT = 6;
const MIN_SLOT = 18;
const SLOT_GROWTH = 5; // per sixteenth beyond the first
const ACCIDENTAL_ROOM = 11;
const SHIFT_ROOM = 14;
/** Half a notehead plus a little air: from the start of a slot to the middle of its notehead. */
const HEAD_OFFSET = 9;
const MAX_STRETCH = 2;
/** A system that needs more than this much shrinking scrolls sideways instead (see the view). */
export const MIN_SCALE = 0.6;

export interface Slot {
  unit: number;
  time: number;
  /** x of the middle of the noteheads, from the start of the system. */
  x: number;
}

/** Width of a key signature with this many sharps or flats (nothing for C major). */
export function keyWidth(fifths: number): number {
  return fifths === 0 ? 0 : 2 * KEY_PAD + Math.min(7, Math.abs(fifths)) * KEY_SIGN_WIDTH;
}

export interface LayoutBar {
  bar: ScoreBar;
  /** x of the left bar line, from the start of the system. */
  x: number;
  width: number;
  /**
   * x where the key signature of this bar is drawn, or null when none is: after the clef at the
   * start of a system, and at the start of a bar where the key changes.
   */
  keyX: number | null;
  /** Room taken inside the bar by a key change (0 for the first bar of a system). */
  keyRoom: number;
  slots: Slot[];
}

export interface Anchor {
  time: number;
  x: number;
  /** True for the bar line at the end of a bar (not a place a click snaps to). */
  barEnd: boolean;
}

export interface System {
  bars: LayoutBar[];
  /** Where the system ends: the available width when it is stretched, more for a dense bar. */
  width: number;
  startTime: number;
  endTime: number;
  /** Sorted by time; the cursor is interpolated between them. */
  anchors: Anchor[];
}

export interface ScoreLayout {
  /** The width the layout was made for. */
  width: number;
  systems: System[];
}

interface BarShape {
  bar: ScoreBar;
  /** Sizes of the slots, left to right, before stretching. */
  slots: { unit: number; time: number; room: number; width: number }[];
  /** Space that doesn't stretch: padding and the time signature. */
  fixed: number;
  /** Space of a key change at the start of the bar; the first bar of a system has it after the clef. */
  keyRoom: number;
  stretchable: number;
}

function shapeOf(bar: ScoreBar): BarShape {
  const columns = [...bar.columns.treble, ...bar.columns.bass];
  const units = [...new Set(columns.map((column) => column.unit))].sort((a, b) => a - b);
  const barEnd = bar.startUnit + bar.units;

  const slots = units
    // A whole-bar rest is centred in the bar and takes no slot of its own.
    .filter((unit) => columns.some((c) => c.unit === unit && !isWholeBarRest(c, bar)))
    .map((unit, i, list) => {
      const here = columns.filter((column) => column.unit === unit);
      const length = (list[i + 1] ?? barEnd) - unit;
      const notes = here.flatMap((column) => column.notes);
      const room = notes.some((note) => note.accidental) ? ACCIDENTAL_ROOM : 0;
      const shift = notes.some((note) => note.shifted) ? SHIFT_ROOM : 0;
      return {
        unit,
        time: here[0].time,
        room,
        width: MIN_SLOT + (length - 1) * SLOT_GROWTH + room + shift,
      };
    });
  // A bar of only whole-bar rests still needs some width.
  if (slots.length === 0) {
    slots.push({ unit: bar.startUnit, time: bar.startTime, room: 0, width: 4 * MIN_SLOT });
  }

  const fixed = BAR_PAD_LEFT + BAR_PAD_RIGHT + (bar.showTimeSignature ? TIME_SIGNATURE_WIDTH : 0);
  return {
    bar,
    slots,
    fixed,
    keyRoom: bar.showKeySignature ? keyWidth(bar.keySignature) : 0,
    stretchable: slots.reduce((sum, slot) => sum + slot.width, 0),
  };
}

export function isWholeBarRest(column: Column, bar: ScoreBar): boolean {
  return column.rest && column.units === bar.units;
}

/** x of a column's noteheads (or of the middle of the bar, for a whole-bar rest). */
export function columnX(layoutBar: LayoutBar, column: Column): number {
  if (isWholeBarRest(column, layoutBar.bar)) {
    const first = layoutBar.slots[0].x;
    const last = layoutBar.slots[layoutBar.slots.length - 1].x;
    // Centred between the first note position and the right bar line when the bar has notes.
    return layoutBar.slots.length > 1 ? (first + last) / 2 : layoutBar.x + layoutBar.width / 2;
  }
  return layoutBar.slots.find((slot) => slot.unit === column.unit)?.x ?? layoutBar.x;
}

/**
 * Wraps the bars of a score into systems for an available width. Every system but the last is
 * stretched to fill the width (by at most a factor of 2); a single bar that is wider than the width gets
 * a system of its own, as wide as it needs.
 */
export function layoutSystems(score: Score, width: number): ScoreLayout {
  const shapes = score.bars.map(shapeOf);
  // Every system starts with the clefs and the key signature of its first bar, so the first bar
  // of a system has no room of its own for a key change.
  const leading = (shape: BarShape) => CLEF_WIDTH + keyWidth(shape.bar.keySignature);
  const natural = (shape: BarShape, first: boolean) =>
    shape.fixed + shape.stretchable + (first ? 0 : shape.keyRoom);

  const groups: BarShape[][] = [];
  let current: BarShape[] = [];
  let used = 0;
  for (const shape of shapes) {
    if (current.length > 0 && used + natural(shape, false) > width) {
      groups.push(current);
      current = [];
    }
    if (current.length === 0) used = leading(shape);
    used += natural(shape, current.length === 0);
    current.push(shape);
  }
  if (current.length > 0) groups.push(current);

  const systems = groups.map((group, groupIndex): System => {
    const needed =
      leading(group[0]) + group.reduce((sum, shape, i) => sum + natural(shape, i === 0), 0);
    const stretchable = group.reduce((sum, shape) => sum + shape.stretchable, 0);
    const isLast = groupIndex === groups.length - 1;
    const factor =
      !isLast && needed < width ? Math.min(MAX_STRETCH, 1 + (width - needed) / stretchable) : 1;

    const bars: LayoutBar[] = [];
    const anchors: Anchor[] = [];
    let x = leading(group[0]);
    for (const [i, shape] of group.entries()) {
      const barX = x;
      const first = i === 0;
      const fifths = shape.bar.keySignature;
      // The first bar of a system draws its key after the clef; a later bar only where it changes.
      const keyX = first
        ? fifths === 0
          ? null
          : CLEF_WIDTH + KEY_PAD
        : shape.bar.showKeySignature && fifths !== 0
          ? barX + BAR_PAD_LEFT + KEY_PAD
          : null;
      const keyRoom = first ? 0 : shape.keyRoom;
      let slotStart =
        barX + BAR_PAD_LEFT + keyRoom + (shape.bar.showTimeSignature ? TIME_SIGNATURE_WIDTH : 0);
      const slots: Slot[] = shape.slots.map((slot) => {
        const placed = { unit: slot.unit, time: slot.time, x: slotStart + slot.room + HEAD_OFFSET };
        slotStart += slot.width * factor;
        return placed;
      });
      const barWidth = slotStart + BAR_PAD_RIGHT - barX;
      bars.push({ bar: shape.bar, x: barX, width: barWidth, keyX, keyRoom, slots });
      for (const slot of slots) anchors.push({ time: slot.time, x: slot.x, barEnd: false });
      anchors.push({ time: shape.bar.endTime, x: barX + barWidth, barEnd: true });
      x += barWidth;
    }

    return {
      bars,
      width: x,
      startTime: group[0].bar.startTime,
      endTime: group[group.length - 1].bar.endTime,
      anchors,
    };
  });

  return { width, systems };
}

/** x of the cursor at a time inside a system: interpolated between the anchors. */
export function xAtTime(system: System, time: number): number {
  const { anchors } = system;
  if (time <= anchors[0].time) return anchors[0].x;
  let i = anchors.length - 1;
  while (i > 0 && anchors[i].time > time) i--;
  const from = anchors[i];
  const to = anchors[i + 1];
  if (!to || to.time <= from.time) return from.x;
  return from.x + ((time - from.time) / (to.time - from.time)) * (to.x - from.x);
}

/** The time of the note position nearest to x in a system (for clicks). */
export function timeAtX(system: System, x: number): number {
  let best = system.anchors.find((anchor) => !anchor.barEnd) ?? system.anchors[0];
  for (const anchor of system.anchors) {
    if (!anchor.barEnd && Math.abs(anchor.x - x) < Math.abs(best.x - x)) best = anchor;
  }
  return best.time;
}

/** Index of the system that holds a time (the last one that has started). */
export function systemIndexAtTime(layout: ScoreLayout, time: number): number {
  let index = 0;
  layout.systems.forEach((system, i) => {
    if (system.startTime <= time) index = i;
  });
  return index;
}

/** The systems that are shown at a time: the current one and the one after it. */
export function visibleSystems(layout: ScoreLayout, time: number): number[] {
  const first = systemIndexAtTime(layout, time);
  return first + 1 < layout.systems.length ? [first, first + 1] : [first];
}
