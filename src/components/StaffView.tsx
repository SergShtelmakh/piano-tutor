import { useMemo } from 'react';
import type { Clef } from '../core/staff.ts';
import { ROW_LEFT, ROW_RIGHT, SECOND_SHIFT, staffRow, type RowStep } from '../core/staffRow.ts';
import { useLocale, useT } from '../i18n/context.ts';
import { noteLabelFor } from '../i18n/noteNames.ts';
import { BASS_CLEF_PATH, TREBLE_CLEF_PATH } from './clefPaths.ts';

// Layout in SVG units. One staff index step (a line to the next space) is half a line gap.
const LINE_GAP = 10;
const STEP = LINE_GAP / 2;
const TOP = 36; // y of the top treble line (index 10); room above for ledger lines
const HEIGHT = 168;
const MARKER_Y = 154; // the triangle under the current step
const NOTE_RX = 7;
const NOTE_RY = 4.8;
const LEDGER_HALF = 11;

const TREBLE_LINES = [10, 8, 6, 4, 2];
const BASS_LINES = [-2, -4, -6, -8, -10];

/** y of a staff index (10 is the top treble line, -10 the bottom bass line). */
function yOf(index: number): number {
  return TOP + (10 - index) * STEP;
}

// The treble clef curls around the G line (G4 = index 4), the bass clef is built on the F line
// (F3 = index -4). The outlines are in staff spaces, so they are scaled by the line gap.
const CLEFS: Record<Clef, { path: string; lineIndex: number }> = {
  treble: { path: TREBLE_CLEF_PATH, lineIndex: 4 },
  bass: { path: BASS_CLEF_PATH, lineIndex: -4 },
};

const COLOR = {
  played: 'text-slate-400',
  current: 'text-sky-600',
  upcoming: 'text-slate-900',
  right: 'text-green-600',
  wrong: 'text-red-600',
} as const;

export interface StaffFlash {
  /** Index of the step in the shown page. */
  step: number;
  kind: 'right' | 'wrong';
}

interface StaffViewProps {
  /** The steps of the shown page, in order. */
  steps: readonly (readonly number[])[];
  /** Index (in `steps`) of the current step; steps before it are played. */
  current: number;
  /** Notes of the current step that were already played right. */
  playedNotes?: readonly number[];
  /** Colours one step for a moment after a judgement. */
  flash?: StaffFlash | null;
  /** The notes named in the accessible label (the current target). */
  labelNotes: readonly number[];
}

/**
 * A grand staff with a row of whole notes. All positions come from `staffRow`; this component
 * only turns them into coordinates. The notes' names are only in the accessible label.
 */
export default function StaffView({
  steps,
  current,
  playedNotes = [],
  flash,
  labelNotes,
}: StaffViewProps) {
  const t = useT();
  const { locale } = useLocale();
  const row = useMemo(() => staffRow(steps), [steps]);
  const label =
    labelNotes.length === 0
      ? t('staffLabel')
      : labelNotes.length === 1
        ? t('staffTargetLabel', { note: noteLabelFor(locale, labelNotes[0]) })
        : t('staffTargetsLabel', {
            notes: labelNotes.map((note) => noteLabelFor(locale, note)).join(', '),
          });

  const stepColor = (index: number) => {
    if (flash?.step === index) return COLOR[flash.kind];
    if (index < current) return COLOR.played;
    return index === current ? COLOR.current : COLOR.upcoming;
  };

  const marker = row.steps[current];

  return (
    <svg
      viewBox={`0 0 ${row.width} ${HEIGHT}`}
      role="img"
      aria-label={label}
      className="h-auto w-full max-w-xl text-slate-900"
    >
      <g stroke="currentColor" strokeWidth={1} aria-hidden="true">
        {[...TREBLE_LINES, ...BASS_LINES].map((index) => (
          <line key={index} x1={ROW_LEFT} x2={ROW_RIGHT} y1={yOf(index)} y2={yOf(index)} />
        ))}
        {/* The barline that joins the two staves. */}
        <line x1={ROW_LEFT} x2={ROW_LEFT} y1={yOf(10)} y2={yOf(-10)} strokeWidth={1.5} />
      </g>

      {(['treble', 'bass'] as const).map((clef) => (
        <path
          key={clef}
          d={CLEFS[clef].path}
          transform={`translate(${ROW_LEFT + 5} ${yOf(CLEFS[clef].lineIndex)}) scale(${LINE_GAP})`}
          fill="currentColor"
          aria-hidden="true"
        />
      ))}

      {row.steps.map((step, i) => (
        <StepNotes
          key={i}
          step={step}
          colorClass={stepColor(i)}
          playedNotes={i === current && flash?.step !== i ? playedNotes : []}
        />
      ))}

      {/* A second cue for the current step besides its colour. */}
      {marker && (
        <path
          d={`M${marker.x - 5} ${MARKER_Y + 6} L${marker.x + 5} ${MARKER_Y + 6} L${marker.x} ${MARKER_Y} Z`}
          className={COLOR.current}
          fill="currentColor"
          aria-hidden="true"
        />
      )}
    </svg>
  );
}

function StepNotes({
  step,
  colorClass,
  playedNotes,
}: {
  step: RowStep;
  colorClass: string;
  playedNotes: readonly number[];
}) {
  return (
    <g aria-hidden="true" className={colorClass}>
      {step.ledger.map((index) => (
        <line
          key={index}
          x1={step.x - LEDGER_HALF}
          x2={step.x + LEDGER_HALF}
          y1={yOf(index)}
          y2={yOf(index)}
          stroke="currentColor"
          strokeWidth={1}
        />
      ))}
      {step.notes.map((n) => {
        const cx = step.x + (n.shifted ? SECOND_SHIFT : 0);
        const cy = yOf(n.index);
        return (
          <g key={n.note} className={playedNotes.includes(n.note) ? COLOR.right : undefined}>
            {/* A whole note: a filled ellipse with a tilted hole. */}
            <ellipse cx={cx} cy={cy} rx={NOTE_RX} ry={NOTE_RY} fill="currentColor" />
            <ellipse
              cx={cx}
              cy={cy}
              rx={NOTE_RX * 0.55}
              ry={NOTE_RY * 0.6}
              fill="white"
              transform={`rotate(-35 ${cx} ${cy})`}
            />
          </g>
        );
      })}
    </g>
  );
}
