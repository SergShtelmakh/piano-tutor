import { useCallback, useMemo, useRef } from 'react';
import type { LessonNotation } from '../core/lesson.ts';
import { layoutSystems, visibleSystems } from '../core/scoreLayout.ts';
import { useLocale, useT } from '../i18n/context.ts';
import { noteLabelFor } from '../i18n/noteNames.ts';
import ScoreView from './ScoreView.tsx';
import { useElementWidth } from './useElementWidth.ts';

const PADDING = 16; // the score box has 8 px of padding on each side

/**
 * The notation of a lesson of a piece: the bars of the lesson, with the current step marked blue and
 * the cursor line on it. It reuses the Player's score view; the current step takes the place of the
 * playing position, and the notes to play are the "sounding" notes.
 */
export default function NotationView({
  notation,
  stepIndex,
  targets,
}: {
  notation: LessonNotation;
  stepIndex: number;
  /** The notes of the current step. */
  targets: readonly number[];
}) {
  const t = useT();
  const { locale } = useLocale();
  const box = useRef<HTMLDivElement>(null);
  const getBox = useCallback(() => box.current, []);
  const boxWidth = useElementWidth(getBox, 328 + PADDING);

  const layout = useMemo(
    () => layoutSystems(notation.score, Math.max(0, boxWidth - PADDING)),
    [notation.score, boxWidth],
  );
  const position = notation.stepTimes[Math.min(stepIndex, notation.stepTimes.length - 1)] ?? 0;
  const sounding = useMemo(() => new Set(targets), [targets]);
  const getPosition = useCallback(() => position, [position]);

  const label =
    targets.length === 0
      ? t('staffLabel')
      : targets.length === 1
        ? t('staffTargetLabel', { note: noteLabelFor(locale, targets[0]) })
        : t('staffTargetsLabel', {
            notes: targets.map((note) => noteLabelFor(locale, note)).join(', '),
          });

  return (
    <div ref={box} className="w-full">
      <ScoreView
        score={notation.score}
        layout={layout}
        visible={visibleSystems(layout, position)}
        sounding={sounding}
        position={position}
        playing={false}
        getPosition={getPosition}
        label={label}
      />
    </div>
  );
}
