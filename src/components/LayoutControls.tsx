import { useRef, type KeyboardEvent, type PointerEvent } from 'react';
import {
  keyboardHeightPx,
  LAYOUT_SIZES,
  snapKeyboardHeight,
  stepSize,
  type LayoutSize,
} from '../core/lessonLayout.ts';
import { useT } from '../i18n/context.ts';
import { SIZE_NAME_KEYS } from './layoutLabels.ts';
import { sectionLabel } from './ui.ts';
import { useShortScreen } from './useWindowSize.ts';

export interface SegmentOption<T> {
  value: T;
  /** What the button shows. */
  text: string;
  /** Its accessible name, when the text alone says too little ("M" is "Medium"). */
  name?: string;
}

/** A row of exclusive choices (the layout editor's size and count pickers). */
export function SegmentedControl<T extends string | number>({
  title,
  options,
  value,
  onChange,
  hideTitle = false,
}: {
  title: string;
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** The group keeps its name for assistive technology; the label is not drawn. */
  hideTitle?: boolean;
}) {
  return (
    <div role="group" aria-label={title} className="flex flex-col gap-2">
      {!hideTitle && <span className={sectionLabel}>{title}</span>}
      <div className="flex gap-1 rounded-2xl bg-bg p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={option.value === value}
            aria-label={option.name}
            onClick={() => onChange(option.value)}
            className={`min-h-11 flex-1 rounded-xl px-2 text-sm ${
              option.value === value
                ? 'bg-accent font-extrabold text-accent-ink'
                : 'font-bold text-ink hover:bg-surface-raised'
            }`}
          >
            {option.text}
          </button>
        ))}
      </div>
    </div>
  );
}

/** An on / off row with a track, like a phone's settings switch. */
export function SwitchRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-11 w-full items-center gap-3 rounded-xl text-left text-base font-semibold text-ink"
    >
      <span className="flex-1">{label}</span>
      <span
        aria-hidden="true"
        className={`relative h-7 w-12 shrink-0 rounded-full ${checked ? 'bg-accent' : 'bg-line-strong'}`}
      >
        <span
          className={`absolute top-[3px] h-[22px] w-[22px] rounded-full bg-ink ${
            checked ? 'left-[23px]' : 'left-[3px]'
          }`}
        />
      </span>
    </button>
  );
}

/**
 * The bar above the piano: drag it up or down to change the piano's height (it snaps to the four
 * sizes), or focus it and use the arrow keys, Page Up / Down, Home, and End.
 */
export function KeyboardHeightHandle({
  size,
  onChange,
}: {
  size: LayoutSize;
  onChange: (size: LayoutSize) => void;
}) {
  const t = useT();
  const short = useShortScreen();
  // Where the drag began: the pointer's y and the piano's height then.
  const drag = useRef<{ y: number; height: number } | null>(null);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    drag.current = { y: event.clientY, height: keyboardHeightPx(size, short) };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start) return;
    // The piano is at the bottom: dragging up makes it taller.
    const next = snapKeyboardHeight(start.height - (event.clientY - start.y), short);
    if (next !== size) onChange(next);
  };
  const onPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next: LayoutSize | null =
      event.key === 'ArrowUp' || event.key === 'ArrowRight' || event.key === 'PageUp'
        ? stepSize(size, 1)
        : event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === 'PageDown'
          ? stepSize(size, -1)
          : event.key === 'Home'
            ? 's'
            : event.key === 'End'
              ? 'xl'
              : null;
    if (next === null) return;
    event.preventDefault();
    if (next !== size) onChange(next);
  };

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={t('layoutKeyboardHeight')}
      aria-orientation="vertical"
      aria-valuemin={0}
      aria-valuemax={LAYOUT_SIZES.length - 1}
      aria-valuenow={LAYOUT_SIZES.indexOf(size)}
      aria-valuetext={t(SIZE_NAME_KEYS[size])}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onKeyDown={onKeyDown}
      className="flex h-11 cursor-ns-resize touch-none select-none items-center gap-2 rounded-full border border-line-strong bg-surface-raised/95 px-4 text-xs font-bold text-ink shadow-lg backdrop-blur short:h-9"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M8 7l4-4 4 4M8 17l4 4 4-4" />
      </svg>
      {t(SIZE_NAME_KEYS[size])}
      <span className="hidden font-semibold text-ink-muted sm:inline short:hidden">
        · {t('layoutHandle')}
      </span>
    </div>
  );
}
