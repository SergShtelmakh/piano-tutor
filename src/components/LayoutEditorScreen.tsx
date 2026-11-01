import { useMemo, useState } from 'react';
import { layoutExample } from '../core/layoutExample.ts';
import {
  LAYOUT_SIZES,
  OCTAVE_CHOICES,
  ROW_COUNTS,
  ROW_SCALES,
  type LayoutSize,
  type LessonLayout,
  type Orientation,
} from '../core/lessonLayout.ts';
import { useT } from '../i18n/context.ts';
import type { MessageKey } from '../i18n/locales/en.ts';
import { useLessonSettings } from '../lesson/settingsContext.ts';
import { BackIcon } from './icons.tsx';
import { KeyboardHeightHandle, SegmentedControl, SwitchRow } from './LayoutControls.tsx';
import { SIZE_NAME_KEYS } from './layoutLabels.ts';
import NotationView from './NotationView.tsx';
import PianoKeyboard from './PianoKeyboard.tsx';
import { buttonIcon, buttonOutline, buttonPrimary, buttonSmall, card, sectionLabel } from './ui.ts';
import { useExampleLoop } from './useExampleLoop.ts';
import { useWindowSize } from './useWindowSize.ts';

/** How long the silent example stays on each step. */
const STEP_MS = 600;

const ORIENTATION_KEYS: Record<Orientation, MessageKey> = {
  portrait: 'layoutPortrait',
  landscape: 'layoutLandscape',
};
const ROW_COUNT_KEYS: Record<(typeof ROW_COUNTS)[number], MessageKey> = {
  1: 'layoutRowCount1',
  2: 'layoutRowCount2',
  3: 'layoutRowCount3',
};

/**
 * The full-window editor of how lessons look. The example plays silently (the cursor and the
 * lit keys move) so every change is seen at once; changes are saved as they are made, for the
 * orientation chosen at the top of the options.
 */
export default function LayoutEditorScreen({ onExit }: { onExit: () => void }) {
  const t = useT();
  const { settings, setLayout, setHint, resetLayout } = useLessonSettings();
  const windowSize = useWindowSize();
  // Which orientation's layout is edited; it starts with the one the window is in.
  const [editing, setEditing] = useState<Orientation>(windowSize.orientation);
  const layout: LessonLayout = settings.layouts[editing];
  const change = (patch: Partial<LessonLayout>) => setLayout(editing, patch);

  const example = useMemo(() => layoutExample(), []);
  const stepIndex = useExampleLoop(example.steps.length, STEP_MS);
  const targets = example.steps[stepIndex];

  const sizeOptions = LAYOUT_SIZES.map((size) => ({
    value: size,
    text: size.toUpperCase(),
    name: t(SIZE_NAME_KEYS[size]),
  }));
  const keyboardName = t(SIZE_NAME_KEYS[layout.keyboardHeight]);

  return (
    <div className="flex h-dvh flex-col bg-bg text-ink">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-3 py-3 short:flex-nowrap short:py-1.5 lg:flex-nowrap lg:px-5">
        <button type="button" onClick={onExit} aria-label={t('lessonBack')} className={buttonIcon}>
          <BackIcon size={24} />
        </button>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h1 className="text-xl font-extrabold">{t('layoutTitle')}</h1>
          <p className="text-sm font-semibold text-ink-muted short:hidden">{t('layoutSubtitle')}</p>
          <p role="status" className="text-xs font-bold text-accent">
            {t('layoutScreenSize', {
              width: windowSize.width,
              height: windowSize.height,
              orientation: t(ORIENTATION_KEYS[windowSize.orientation]),
            })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => resetLayout(editing)}
          className={`${buttonOutline} ${buttonSmall}`}
        >
          {t('layoutReset')}
        </button>
        <button type="button" onClick={onExit} className={`${buttonPrimary} ${buttonSmall}`}>
          {t('layoutDone')}
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 pt-4 short:flex-row lg:flex-row lg:px-5">
        <aside
          aria-label={t('layoutOptions')}
          className={`${card} flex w-full flex-col gap-4 p-4 short:order-last short:w-80 short:shrink-0 short:overflow-y-auto lg:order-last lg:w-80 lg:shrink-0 lg:overflow-y-auto`}
        >
          <SegmentedControl<Orientation>
            title={t('layoutEditing')}
            value={editing}
            onChange={setEditing}
            options={(['portrait', 'landscape'] as const).map((orientation) => ({
              value: orientation,
              text: t(ORIENTATION_KEYS[orientation]),
            }))}
          />
          <p className="-mt-2 text-xs text-ink-muted">{t('layoutShownAt')}</p>
          <SegmentedControl<LayoutSize>
            title={t('layoutKeyboardHeight')}
            value={layout.keyboardHeight}
            onChange={(keyboardHeight) => change({ keyboardHeight })}
            options={sizeOptions}
          />
          <SegmentedControl<LessonLayout['octaves']>
            title={t('layoutOctaves')}
            value={layout.octaves}
            onChange={(octaves) => change({ octaves })}
            options={OCTAVE_CHOICES.map((octaves) => ({
              value: octaves,
              text: octaves === 'auto' ? t('layoutOctavesAuto') : String(octaves),
              name: octaves === 'auto' ? undefined : t('layoutOctaveCount', { count: octaves }),
            }))}
          />
          <SegmentedControl<LessonLayout['rows']>
            title={t('layoutRows')}
            value={layout.rows}
            onChange={(rows) => change({ rows })}
            options={ROW_COUNTS.map((rows) => ({
              value: rows,
              text: String(rows),
              name: t(ROW_COUNT_KEYS[rows]),
            }))}
          />
          <p className="-mt-2 text-xs text-ink-muted">{t('layoutRowsNote')}</p>
          <SegmentedControl<LayoutSize>
            title={t('layoutRowHeight')}
            value={layout.rowHeight}
            onChange={(rowHeight) => change({ rowHeight })}
            options={sizeOptions}
          />
          <div className="border-t border-line pt-2">
            <SwitchRow
              label={t('layoutNoteNames')}
              checked={layout.noteNames}
              onChange={(noteNames) => change({ noteNames })}
            />
            <SwitchRow label={t('layoutHint')} checked={settings.hint} onChange={setHint} />
          </div>
        </aside>

        <section
          aria-label={t('layoutMusicSection')}
          className="min-w-0 flex-1 rounded-2xl border-2 border-dashed border-line-strong p-2 short:overflow-y-auto"
        >
          <NotationView
            notation={example.notation}
            stepIndex={stepIndex}
            targets={targets}
            rows={layout.rows}
            scale={ROW_SCALES[layout.rowHeight]}
          />
        </section>
      </div>

      <KeyboardHeightHandle
        size={layout.keyboardHeight}
        onChange={(keyboardHeight) => change({ keyboardHeight })}
      />
      <section
        aria-label={t('layoutKeyboardSection', { size: keyboardName })}
        className="mx-2 mb-2 rounded-2xl border-2 border-dashed border-line-strong p-1"
      >
        <p className={`${sectionLabel} px-2 pb-1 short:hidden`}>
          {t('layoutKeyboardSection', { size: keyboardName })}
        </p>
        <PianoKeyboard
          include={example.range}
          focusNotes={targets}
          shown={targets}
          hints={settings.hint ? targets : undefined}
          height={layout.keyboardHeight}
          octaves={layout.octaves}
          allNames={layout.noteNames}
        />
      </section>
    </div>
  );
}
