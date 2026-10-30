import { memo, useEffect, useMemo, useRef, useState, type MouseEvent, type RefObject } from 'react';
import {
  MIDDLE_LINE,
  stemDirection,
  type Column,
  type Score,
  type ScoreBar,
  type ScoreNote,
} from '../core/score.ts';
import {
  BAR_PAD_LEFT,
  CLEF_WIDTH,
  columnX,
  KEY_SIGN_WIDTH,
  MIN_SCALE,
  timeAtX,
  xAtTime,
  type LayoutBar,
  type ScoreLayout,
  type System,
} from '../core/scoreLayout.ts';
import { keySignatureIndexes } from '../core/spelling.ts';
import type { Clef } from '../core/staff.ts';
import { BASS_CLEF_PATH, TREBLE_CLEF_PATH } from './clefPaths.ts';
import {
  FLAG_EIGHTH_DOWN_PATH,
  FLAG_EIGHTH_UP_PATH,
  FLAG_SIXTEENTH_DOWN_PATH,
  FLAG_SIXTEENTH_UP_PATH,
  FLAT_PATH,
  NATURAL_PATH,
  REST_EIGHTH_PATH,
  REST_HALF_PATH,
  REST_QUARTER_PATH,
  REST_SIXTEENTH_PATH,
  REST_WHOLE_PATH,
  SHARP_PATH,
} from './notationPaths.ts';

// Layout in SVG units, as in the lesson staff: one staff index step is half a line gap.
const GAP = 10;
const STEP = GAP / 2;
const RX = 6.6;
const RY = 4.6;
const STEM_LENGTH = 33;
const LEDGER_HALF = 11;
const SHIFT = 14;
const MARGIN = 26;
/** Staff steps from the bottom line of the treble staff to the top line of the bass staff. */
const BASE_GAP_STEPS = 4;
const TREBLE_LINES = [10, 8, 6, 4, 2];
const BASS_LINES = [-2, -4, -6, -8, -10];
const SEEK_SLACK = 0.1; // seconds: a column counts as sounding a little before its rounded start

const FLAGS = {
  eighth: { up: FLAG_EIGHTH_UP_PATH, down: FLAG_EIGHTH_DOWN_PATH },
  sixteenth: { up: FLAG_SIXTEENTH_UP_PATH, down: FLAG_SIXTEENTH_DOWN_PATH },
} as const;
const RESTS = {
  whole: REST_WHOLE_PATH,
  half: REST_HALF_PATH,
  quarter: REST_QUARTER_PATH,
  eighth: REST_EIGHTH_PATH,
  sixteenth: REST_SIXTEENTH_PATH,
} as const;

interface Geometry {
  /** y of the top treble line. */
  top: number;
  height: number;
  /** How far the bass staff is moved down to leave room between the staves. */
  bassShift: number;
}

/** Room above and below the staves for the notes of the whole piece, and between the staves. */
function measure(score: Score): Geometry {
  const top = MARGIN + Math.max(0, score.highIndex - 10) * STEP;
  const bassShift = (score.gapSteps - BASE_GAP_STEPS) * STEP;
  const bottom = top + 20 * STEP + bassShift + MARGIN + Math.max(0, -10 - score.lowIndex) * STEP;
  return { top, height: bottom, bassShift };
}

/** y of a staff index on a staff: the bass staff sits lower by the extra room between the staves. */
const yOf = (geometry: Geometry, index: number, clef: Clef) =>
  geometry.top + (10 - index) * STEP + (clef === 'bass' ? geometry.bassShift : 0);

/** Widths of the signs (in SVG units), so a sign ends just before its notehead. */
const SIGN_WIDTH = { sharp: 10, flat: 9, natural: 6.7 } as const;
const SIGN_PATH = { sharp: SHARP_PATH, flat: FLAT_PATH, natural: NATURAL_PATH } as const;

interface PlacedColumn {
  column: Column;
  clef: Clef;
  x: number;
}

function placedColumns(system: System): PlacedColumn[] {
  return system.bars.flatMap((layoutBar) =>
    (['treble', 'bass'] as const).flatMap((clef) =>
      layoutBar.bar.columns[clef].map((column) => ({
        column,
        clef,
        x: columnX(layoutBar, column),
      })),
    ),
  );
}

function RestView({
  column,
  clef,
  x,
  geometry,
}: {
  column: Column;
  clef: Clef;
  x: number;
  geometry: Geometry;
}) {
  const middle = MIDDLE_LINE[clef];
  // A whole rest hangs from the second line from the top, a half rest sits on the middle line.
  const index = column.value === 'whole' ? middle + 2 : middle;
  const y = yOf(geometry, index, clef);
  return (
    <g>
      <path
        d={RESTS[column.value]}
        transform={`translate(${x - 5} ${y}) scale(${GAP})`}
        fill="currentColor"
      />
      {column.dots > 0 && <circle cx={x + 10} cy={y - STEP} r={1.6} fill="currentColor" />}
    </g>
  );
}

function NoteColumn({
  column,
  clef,
  x,
  geometry,
  sounding,
  position,
}: {
  column: Column;
  clef: Clef;
  x: number;
  geometry: Geometry;
  sounding: ReadonlySet<number>;
  position: number;
}) {
  const notes = column.notes;
  const direction = stemDirection(notes, clef);
  const noteX = (note: ScoreNote) => x + (note.shifted ? SHIFT : 0);
  const ys = notes.map((note) => yOf(geometry, note.index, clef));
  const yHigh = Math.min(...ys);
  const yLow = Math.max(...ys);
  const open = column.value === 'whole' || column.value === 'half';
  const hasStem = column.value !== 'whole';
  const stemX = direction === 'up' ? x + RX - 0.7 : x - RX + 0.7;
  const stemTip = direction === 'up' ? yHigh - STEM_LENGTH : yLow + STEM_LENGTH;
  // A stem stops at the edge of its own staff, so it does not run into the other one.
  const stemEnd =
    clef === 'bass' && direction === 'up'
      ? Math.max(stemTip, yOf(geometry, -2, 'bass'))
      : clef === 'treble' && direction === 'down'
        ? Math.min(stemTip, yOf(geometry, 2, 'treble'))
        : stemTip;
  const anyShifted = notes.some((note) => note.shifted);

  return (
    <g>
      {notes.flatMap((note) =>
        note.ledger.map((index) => (
          <line
            key={`${note.note}-${index}`}
            x1={noteX(note) - LEDGER_HALF}
            x2={noteX(note) + LEDGER_HALF}
            y1={yOf(geometry, index, clef)}
            y2={yOf(geometry, index, clef)}
            stroke="currentColor"
            strokeWidth={1.2}
          />
        )),
      )}
      {hasStem && (
        <line
          x1={stemX}
          x2={stemX}
          y1={direction === 'up' ? yLow : yHigh}
          y2={stemEnd}
          stroke="currentColor"
          strokeWidth={1.4}
        />
      )}
      {(column.value === 'eighth' || column.value === 'sixteenth') && (
        <path
          d={FLAGS[column.value][direction]}
          transform={`translate(${stemX - 0.7} ${stemEnd}) scale(${GAP})`}
          fill="currentColor"
        />
      )}
      {notes.map((note, i) => {
        const y = ys[i];
        const blue =
          sounding.has(note.note) &&
          position >= column.time - SEEK_SLACK &&
          position < column.endTime;
        const nx = noteX(note);
        return (
          <g key={note.note} className={blue ? 'text-sky-600' : 'text-slate-900'}>
            {note.accidental && (
              <path
                d={SIGN_PATH[note.accidental]}
                transform={`translate(${nx - RX - 2.5 - SIGN_WIDTH[note.accidental]} ${y}) scale(${GAP})`}
                fill="currentColor"
              />
            )}
            <ellipse
              cx={nx}
              cy={y}
              rx={RX}
              ry={RY}
              fill={open ? 'white' : 'currentColor'}
              stroke="currentColor"
              strokeWidth={open ? 1.7 : 0.6}
            />
            {column.dots > 0 && (
              <circle
                cx={x + RX + 4 + (anyShifted ? SHIFT : 0)}
                cy={note.index % 2 === 0 ? y - STEP : y}
                r={1.6}
                fill="currentColor"
              />
            )}
          </g>
        );
      })}
    </g>
  );
}

function BarView({
  layoutBar,
  geometry,
  isLast,
  sounding,
  position,
}: {
  layoutBar: LayoutBar;
  geometry: Geometry;
  isLast: boolean;
  sounding: ReadonlySet<number>;
  position: number;
}) {
  const { bar } = layoutBar;
  const right = layoutBar.x + layoutBar.width;
  const y1 = yOf(geometry, 10, 'treble');
  const y2 = yOf(geometry, -10, 'bass');
  return (
    <g className="text-slate-900">
      <line
        x1={right}
        x2={right}
        y1={y1}
        y2={y2}
        stroke="currentColor"
        strokeWidth={isLast ? 3 : 1.2}
      />
      {layoutBar.keyX !== null && (
        <KeySignature x={layoutBar.keyX} fifths={bar.keySignature} geometry={geometry} />
      )}
      {bar.showTimeSignature && (
        <TimeSignature
          bar={bar}
          x={layoutBar.x + BAR_PAD_LEFT + layoutBar.keyRoom + 8}
          geometry={geometry}
        />
      )}
      {(['treble', 'bass'] as const).flatMap((clef) =>
        bar.columns[clef].map((column) => {
          const x = columnX(layoutBar, column);
          return column.rest ? (
            <RestView
              key={`${clef}-${column.unit}`}
              column={column}
              clef={clef}
              x={x}
              geometry={geometry}
            />
          ) : (
            <NoteColumn
              key={`${clef}-${column.unit}`}
              column={column}
              clef={clef}
              x={x}
              geometry={geometry}
              sounding={sounding}
              position={position}
            />
          );
        }),
      )}
    </g>
  );
}

/** The sharps or flats of a key signature, on both staves, left to right from `x`. */
function KeySignature({ x, fifths, geometry }: { x: number; fifths: number; geometry: Geometry }) {
  const path = fifths > 0 ? SHARP_PATH : FLAT_PATH;
  return (
    <g fill="currentColor">
      {(['treble', 'bass'] as const).flatMap((clef) =>
        keySignatureIndexes(fifths, clef).map((index, i) => (
          <path
            key={`${clef}-${i}`}
            d={path}
            transform={`translate(${x + i * KEY_SIGN_WIDTH} ${yOf(geometry, index, clef)}) scale(${GAP})`}
          />
        )),
      )}
    </g>
  );
}

function TimeSignature({ bar, x, geometry }: { bar: ScoreBar; x: number; geometry: Geometry }) {
  const { numerator, denominator } = bar.timeSignature;
  const props = {
    x,
    textAnchor: 'middle' as const,
    fontSize: 22,
    fontWeight: 700,
    fill: 'currentColor',
    fontFamily: "Georgia, 'Times New Roman', serif",
  };
  return (
    <g>
      {(['treble', 'bass'] as const).map((clef) => {
        const middle = yOf(geometry, MIDDLE_LINE[clef], clef);
        return (
          <g key={clef}>
            <text {...props} y={middle - 2}>
              {numerator}
            </text>
            <text {...props} y={middle + 18}>
              {denominator}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** Ties between notes of the same pitch in neighbouring columns of one staff. */
function Ties({ columns, geometry }: { columns: PlacedColumn[]; geometry: Geometry }) {
  const marks: { key: string; d: string }[] = [];
  (['treble', 'bass'] as const).forEach((clef) => {
    const staff = columns.filter((placed) => placed.clef === clef && !placed.column.rest);
    staff.forEach((placed, i) => {
      const direction = stemDirection(placed.column.notes, clef);
      const side = direction === 'up' ? 1 : -1; // the tie is on the side opposite the stem
      for (const note of placed.column.notes) {
        const y = yOf(geometry, note.index, clef) + side * (RY + 1);
        const x = placed.x + (note.shifted ? SHIFT : 0);
        const curve = (from: number, to: number) =>
          `M${from} ${y}Q${(from + to) / 2} ${y + side * 8} ${to} ${y}`;
        if (note.tieNext) {
          const next = staff[i + 1]?.column.notes.find((n) => n.note === note.note);
          const to = next ? staff[i + 1].x - RX - 1 : x + 26;
          marks.push({
            key: `n-${clef}-${placed.column.unit}-${note.note}`,
            d: curve(x + RX + 1, to),
          });
        }
        if (note.tiePrev && i === 0) {
          marks.push({
            key: `p-${clef}-${placed.column.unit}-${note.note}`,
            d: curve(x - 26, x - RX - 1),
          });
        }
      }
    });
  });
  return (
    <g className="text-slate-900" fill="none" stroke="currentColor" strokeWidth={1.3}>
      {marks.map((mark) => (
        <path key={mark.key} d={mark.d} />
      ))}
    </g>
  );
}

function CursorLine({
  system,
  geometry,
  position,
  playing,
  getPosition,
  scale,
  scroller,
}: {
  system: System;
  geometry: Geometry;
  position: number;
  playing: boolean;
  getPosition: () => number;
  scale: number;
  scroller: RefObject<HTMLDivElement | null>;
}) {
  const inside = (t: number) => t >= system.startTime && t <= system.endTime;
  const [animated, setAnimated] = useState<number | null>(null);

  // While playing, the cursor follows the clock every frame; otherwise it follows `position`.
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const loop = () => {
      const t = getPosition();
      const x = inside(t) ? xAtTime(system, t) : null;
      setAnimated(x);
      const box = scroller.current;
      if (x !== null && box && box.scrollWidth > box.clientWidth + 1) {
        const px = x * scale;
        if (px < box.scrollLeft + 24 || px > box.scrollLeft + box.clientWidth - 48) {
          box.scrollLeft = px - box.clientWidth / 3;
        }
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
    // `inside` only reads `system`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, system, getPosition, scale, scroller]);

  const resting = inside(position) ? xAtTime(system, position) : null;
  const x = playing ? (animated ?? resting) : resting;
  if (x === null) return null;
  return (
    <line
      x1={x}
      x2={x}
      y1={yOf(geometry, 10, 'treble') - 14}
      y2={yOf(geometry, -10, 'bass') + 14}
      stroke="#0ea5e9"
      strokeWidth={2}
      strokeLinecap="round"
    />
  );
}

interface SystemViewProps {
  system: System;
  geometry: Geometry;
  layoutWidth: number;
  isLast: boolean;
  sounding: ReadonlySet<number>;
  position: number;
  playing: boolean;
  getPosition: () => number;
  scroller: RefObject<HTMLDivElement | null>;
  onSeek?: (seconds: number) => void;
}

const SystemView = memo(function SystemView({
  system,
  geometry,
  layoutWidth,
  isLast,
  sounding,
  position,
  playing,
  getPosition,
  scroller,
  onSeek,
}: SystemViewProps) {
  const columns = useMemo(() => placedColumns(system), [system]);
  // A bar that is wider than the box is shrunk, down to a floor; below it the box scrolls.
  const viewWidth = Math.max(layoutWidth, system.width);
  const displayWidth =
    system.width > layoutWidth ? Math.max(layoutWidth, system.width * MIN_SCALE) : layoutWidth;
  const scale = displayWidth / viewWidth;

  const seek = (event: MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onSeek?.(timeAtX(system, ((event.clientX - rect.left) / rect.width) * viewWidth));
  };

  return (
    <svg
      viewBox={`0 0 ${viewWidth} ${geometry.height}`}
      width={displayWidth}
      height={geometry.height * scale}
      aria-hidden="true"
      className={`block text-slate-900 ${onSeek ? 'cursor-pointer' : ''}`}
      onClick={onSeek ? seek : undefined}
    >
      {(
        [
          ['treble', TREBLE_LINES],
          ['bass', BASS_LINES],
        ] as const
      ).flatMap(([clef, lines]) =>
        lines.map((index) => (
          <line
            key={`${clef}-${index}`}
            x1={6}
            x2={system.width}
            y1={yOf(geometry, index, clef)}
            y2={yOf(geometry, index, clef)}
            stroke="currentColor"
            strokeWidth={1}
          />
        )),
      )}
      <line
        x1={6}
        x2={6}
        y1={yOf(geometry, 10, 'treble')}
        y2={yOf(geometry, -10, 'bass')}
        stroke="currentColor"
        strokeWidth={1.6}
      />
      <path
        d={TREBLE_CLEF_PATH}
        transform={`translate(12 ${yOf(geometry, 4, 'treble')}) scale(${GAP})`}
        fill="currentColor"
      />
      <path
        d={BASS_CLEF_PATH}
        transform={`translate(12 ${yOf(geometry, -4, 'bass')}) scale(${GAP})`}
        fill="currentColor"
      />
      {system.bars.map((layoutBar, i) => (
        <BarView
          key={layoutBar.bar.number}
          layoutBar={layoutBar}
          geometry={geometry}
          isLast={isLast && i === system.bars.length - 1}
          sounding={sounding}
          position={position}
        />
      ))}
      <Ties columns={columns} geometry={geometry} />
      <CursorLine
        system={system}
        geometry={geometry}
        position={position}
        playing={playing}
        getPosition={getPosition}
        scale={scale}
        scroller={scroller}
      />
    </svg>
  );
});

export interface ScoreViewProps {
  score: Score;
  layout: ScoreLayout;
  /** Indices of the systems to draw (the current one and the next). */
  visible: readonly number[];
  /** Notes playback holds now, and the position (seconds) they were read at. */
  sounding: ReadonlySet<number>;
  position: number;
  playing: boolean;
  /** The exact position, read every frame for the moving cursor. */
  getPosition: () => number;
  /** The accessible name of the whole score (file name and bar count). */
  label: string;
  onSeek?: (seconds: number) => void;
}

export default function ScoreView({
  score,
  layout,
  visible,
  sounding,
  position,
  playing,
  getPosition,
  label,
  onSeek,
}: ScoreViewProps) {
  const geometry = useMemo(() => measure(score), [score]);
  const scroller = useRef<HTMLDivElement>(null);
  // The clefs reserve CLEF_WIDTH in every system; a layout narrower than that cannot be drawn.
  const layoutWidth = Math.max(layout.width, CLEF_WIDTH + 1);

  return (
    <div
      ref={scroller}
      role="img"
      aria-label={label}
      className="flex w-full flex-col overflow-x-auto rounded-lg bg-white p-2 shadow-sm"
    >
      {visible.map((index) => (
        <SystemView
          key={index}
          system={layout.systems[index]}
          geometry={geometry}
          layoutWidth={layoutWidth}
          isLast={index === layout.systems.length - 1}
          sounding={sounding}
          position={position}
          playing={playing}
          getPosition={getPosition}
          scroller={scroller}
          onSeek={onSeek}
        />
      ))}
    </div>
  );
}
