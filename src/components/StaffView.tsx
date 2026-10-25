import { staffPosition, type Clef } from '../core/staff.ts';
import { useLocale, useT } from '../i18n/context.ts';
import { noteLabelFor } from '../i18n/noteNames.ts';
import { BASS_CLEF_PATH, TREBLE_CLEF_PATH } from './clefPaths.ts';

// Layout in SVG units. One staff index step (a line to the next space) is half a line gap.
const LINE_GAP = 10;
const STEP = LINE_GAP / 2;
const TOP = 36; // y of the top treble line (index 10); room above for ledger lines
const WIDTH = 240;
const HEIGHT = 160;
const LEFT = 10;
const RIGHT = 230;
const NOTE_X = 140;
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

const FEEDBACK_COLOR = { right: 'text-green-600', wrong: 'text-red-600' } as const;

interface StaffViewProps {
  /** The note that is drawn, or null for an empty staff. */
  note: number | null;
  /** The note that is named in the accessible label (the current target). */
  labelNote: number | null;
  /** Colours the notehead for a moment after a judgement. */
  feedback?: 'right' | 'wrong' | null;
}

/**
 * A grand staff with one whole note. All positions come from `staffPosition`; this component
 * only turns them into coordinates. The note's name is only in the accessible label.
 */
export default function StaffView({ note, labelNote, feedback }: StaffViewProps) {
  const t = useT();
  const { locale } = useLocale();
  const position = note === null ? null : staffPosition(note);
  const label =
    labelNote === null
      ? t('staffLabel')
      : t('staffTargetLabel', { note: noteLabelFor(locale, labelNote) });

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={label}
      className="h-auto w-full max-w-md text-slate-900"
    >
      <g stroke="currentColor" strokeWidth={1} aria-hidden="true">
        {[...TREBLE_LINES, ...BASS_LINES].map((index) => (
          <line key={index} x1={LEFT} x2={RIGHT} y1={yOf(index)} y2={yOf(index)} />
        ))}
        {/* The barline that joins the two staves. */}
        <line x1={LEFT} x2={LEFT} y1={yOf(10)} y2={yOf(-10)} strokeWidth={1.5} />
      </g>

      {(['treble', 'bass'] as const).map((clef) => (
        <path
          key={clef}
          d={CLEFS[clef].path}
          transform={`translate(${LEFT + 5} ${yOf(CLEFS[clef].lineIndex)}) scale(${LINE_GAP})`}
          fill="currentColor"
          aria-hidden="true"
        />
      ))}

      {position && (
        <g aria-hidden="true" className={feedback ? FEEDBACK_COLOR[feedback] : undefined}>
          {position.ledger.map((index) => (
            <line
              key={index}
              x1={NOTE_X - LEDGER_HALF}
              x2={NOTE_X + LEDGER_HALF}
              y1={yOf(index)}
              y2={yOf(index)}
              stroke="currentColor"
              strokeWidth={1}
            />
          ))}
          {/* A whole note: a filled ellipse with a tilted hole. */}
          <ellipse
            cx={NOTE_X}
            cy={yOf(position.index)}
            rx={NOTE_RX}
            ry={NOTE_RY}
            fill="currentColor"
          />
          <ellipse
            cx={NOTE_X}
            cy={yOf(position.index)}
            rx={NOTE_RX * 0.55}
            ry={NOTE_RY * 0.6}
            fill="white"
            transform={`rotate(-35 ${NOTE_X} ${yOf(position.index)})`}
          />
        </g>
      )}
    </svg>
  );
}
