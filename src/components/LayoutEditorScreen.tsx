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
import { BackIcon, ResetIcon, SlidersIcon } from './icons.tsx';
import { KeyboardHeightHandle, SegmentedControl, SwitchRow } from './LayoutControls.tsx';
import { SIZE_NAME_KEYS } from './layoutLabels.ts';
import NotationView from './NotationView.tsx';
import PianoKeyboard from './PianoKeyboard.tsx';
import { buttonIcon, buttonPrimary, buttonSmall, chip, chipOn } from './ui.ts';
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

/** The settings the panel shows one at a time, so it takes little room over the layout. */
type Section = 'orientation' | 'keyboard' | 'octaves' | 'rows' | 'rowHeight' | 'names' | 'hint';

/**
 * The full-window editor of how lessons look. The bottom layer is the lesson itself, drawn as a
 * lesson draws it (a silent example plays, so every change is seen at once); the controls float
 * over it: a slim bar at the top, a small panel with one setting at a time (it can be hidden), and
 * the keyboard height handle on the piano. Changes are saved as they are made, for the orientation
 * of the window (it follows a rotation) or the one picked in the panel.
 */
export default function LayoutEditorScreen({ onExit }: { onExit: () => void }) {
  const t = useT();
  const { settings, setLayout, setHint, resetLayout } = useLessonSettings();
  const windowSize = useWindowSize();
  // The orientation picked by hand holds only while the window stays in the orientation it was
  // picked in: a rotation drops it, and the layout of the new orientation is edited by itself.
  const [picked, setPicked] = useState<{ editing: Orientation; inWindow: Orientation } | null>(
    null,
  );
  if (picked && picked.inWindow !== windowSize.orientation) setPicked(null);
  const editing = picked ? picked.editing : windowSize.orientation;
  const [optionsOpen, setOptionsOpen] = useState(true);
  const [section, setSection] = useState<Section>('keyboard');
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

  const sections: { id: Section; label: string }[] = [
    { id: 'orientation', label: t(ORIENTATION_KEYS[editing]) },
    { id: 'keyboard', label: t('layoutKeyboardHeight') },
    { id: 'octaves', label: t('layoutOctaves') },
    { id: 'rows', label: t('layoutRows') },
    { id: 'rowHeight', label: t('layoutRowHeight') },
    { id: 'names', label: t('layoutNoteNames') },
    { id: 'hint', label: t('layoutHint') },
  ];

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
          className="absolute inset-x-2 top-16 z-10 flex max-h-[50dvh] flex-col gap-3 overflow-y-auto rounded-2xl border border-line bg-surface/95 p-3 shadow-xl backdrop-blur sm:left-auto sm:w-80 short:max-h-[calc(100dvh-4.5rem)]"
        >
          <div
            role="group"
            aria-label={t('layoutSectionTitle')}
            className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {sections.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={section === item.id}
                onClick={() => setSection(item.id)}
                className={`${section === item.id ? chipOn : chip} shrink-0`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {section === 'orientation' && (
            <>
              <SegmentedControl<Orientation>
                title={t('layoutEditing')}
                hideTitle
                value={editing}
                onChange={(next) => setPicked({ editing: next, inWindow: windowSize.orientation })}
                options={(['portrait', 'landscape'] as const).map((orientation) => ({
                  value: orientation,
                  text: t(ORIENTATION_KEYS[orientation]),
                }))}
              />
              <p className="text-xs text-ink-muted">{t('layoutShownAt')}</p>
            </>
          )}
          {section === 'keyboard' && (
            <SegmentedControl<LayoutSize>
              title={t('layoutKeyboardHeight')}
              hideTitle
              value={layout.keyboardHeight}
              onChange={(keyboardHeight) => change({ keyboardHeight })}
              options={sizeOptions}
            />
          )}
          {section === 'octaves' && (
            <SegmentedControl<LessonLayout['octaves']>
              title={t('layoutOctaves')}
              hideTitle
              value={layout.octaves}
              onChange={(octaves) => change({ octaves })}
              options={OCTAVE_CHOICES.map((octaves) => ({
                value: octaves,
                text: octaves === 'auto' ? t('layoutOctavesAuto') : String(octaves),
                name:
                  octaves === 'auto'
                    ? undefined
                    : octaves === 1
                      ? t('layoutOctaveOne')
                      : t('layoutOctaveCount', { count: octaves }),
              }))}
            />
          )}
          {section === 'rows' && (
            <>
              <SegmentedControl<LessonLayout['rows']>
                title={t('layoutRows')}
                hideTitle
                value={layout.rows}
                onChange={(rows) => change({ rows })}
                options={ROW_COUNTS.map((rows) => ({
                  value: rows,
                  text: String(rows),
                  name: t(ROW_COUNT_KEYS[rows]),
                }))}
              />
              <p className="text-xs text-ink-muted">{t('layoutRowsNote')}</p>
            </>
          )}
          {section === 'rowHeight' && (
            <SegmentedControl<LayoutSize>
              title={t('layoutRowHeight')}
              hideTitle
              value={layout.rowHeight}
              onChange={(rowHeight) => change({ rowHeight })}
              options={sizeOptions}
            />
          )}
          {section === 'names' && (
            <SwitchRow
              label={t('layoutNoteNames')}
              checked={layout.noteNames}
              onChange={(noteNames) => change({ noteNames })}
            />
          )}
          {section === 'hint' && (
            <SwitchRow label={t('layoutHint')} checked={settings.hint} onChange={setHint} />
          )}
        </aside>
      )}
    </div>
  );
}
