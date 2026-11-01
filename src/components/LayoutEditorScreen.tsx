import { useMemo, useState } from 'react';
import { layoutExample } from '../core/layoutExample.ts';
import {
  keyboardHeightPx,
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
import { BackIcon, ResetIcon, SlidersIcon } from './icons.tsx';
import { KeyboardHeightHandle, SegmentedControl, SwitchRow } from './LayoutControls.tsx';
import { SIZE_NAME_KEYS } from './layoutLabels.ts';
import NotationView from './NotationView.tsx';
import PianoKeyboard from './PianoKeyboard.tsx';
import { buttonIcon, buttonPrimary, buttonSmall } from './ui.ts';
import { useExampleLoop } from './useExampleLoop.ts';
import { useShortScreen, useWindowSize } from './useWindowSize.ts';

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
 * The full-window editor of how lessons look. The bottom layer is the lesson itself, drawn as a
 * lesson draws it (a silent example plays, so every change is seen at once); the controls float
 * over it: a slim bar at the top, the options in a panel that can be hidden, and the keyboard
 * height handle on the piano. Changes are saved as they are made, for the orientation chosen in
 * the options.
 */
export default function LayoutEditorScreen({ onExit }: { onExit: () => void }) {
  const t = useT();
  const { settings, setLayout, setHint, resetLayout } = useLessonSettings();
  const windowSize = useWindowSize();
  const short = useShortScreen();
  // Which orientation's layout is edited; it starts with the one the window is in.
  const [editing, setEditing] = useState<Orientation>(windowSize.orientation);
  const [optionsOpen, setOptionsOpen] = useState(true);
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
  // The panel leaves the piano in sight: it is as tall as the room between the bar and the piano.
  // On a short screen it sits at the side, over the right part of the piano, and may be taller.
  const panelMaxHeight = short
    ? 'calc(100dvh - 4.5rem)'
    : `max(8rem, min(65dvh, calc(100dvh - 4.5rem - ${keyboardHeightPx(layout.keyboardHeight, short) + 100}px)))`;

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-bg text-ink">
      {/* The layer being edited: the notation and the piano, as a lesson draws them. */}
      <div className="flex min-h-0 flex-1 flex-col pt-14">
        <main
          aria-label={t('layoutMusicSection')}
          className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-3 py-4 short:py-2 wide:px-8"
        >
          <div className="my-auto w-full">
            <NotationView
              notation={example.notation}
              stepIndex={stepIndex}
              targets={targets}
              rows={layout.rows}
              scale={ROW_SCALES[layout.rowHeight]}
            />
          </div>
        </main>
        <section
          aria-label={t('layoutKeyboardSection', { size: keyboardName })}
          className="relative px-2 pb-2"
        >
          <div className="absolute inset-x-0 -top-12 z-10 flex justify-center short:-top-10">
            <KeyboardHeightHandle
              size={layout.keyboardHeight}
              onChange={(keyboardHeight) => change({ keyboardHeight })}
            />
          </div>
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

      {/* The controls, over the layout. */}
      <header className="absolute inset-x-0 top-0 z-20 flex h-14 items-center gap-2 border-b border-line bg-bg/90 px-2 backdrop-blur sm:px-3">
        <button type="button" onClick={onExit} aria-label={t('lessonBack')} className={buttonIcon}>
          <BackIcon size={24} />
        </button>
        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="hidden truncate text-base font-extrabold sm:block">{t('layoutTitle')}</h1>
          <p role="status" className="text-xs font-bold leading-tight text-accent">
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
          aria-label={t('layoutReset')}
          title={t('layoutReset')}
          className={buttonIcon}
        >
          <ResetIcon size={22} />
        </button>
        <button
          type="button"
          onClick={() => setOptionsOpen((open) => !open)}
          aria-pressed={optionsOpen}
          aria-label={t('layoutOptions')}
          title={t('layoutOptions')}
          className={`${buttonIcon} ${optionsOpen ? 'ring-2 ring-accent' : ''}`}
        >
          <SlidersIcon size={22} />
        </button>
        <button type="button" onClick={onExit} className={`${buttonPrimary} ${buttonSmall}`}>
          {t('layoutDone')}
        </button>
      </header>

      {optionsOpen && (
        <aside
          aria-label={t('layoutOptions')}
          style={{ maxHeight: panelMaxHeight }}
          className="absolute inset-x-2 top-16 z-10 flex flex-col gap-4 overflow-y-auto rounded-2xl border border-line bg-surface/95 p-4 shadow-xl backdrop-blur sm:left-auto sm:w-80"
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
      )}
    </div>
  );
}
