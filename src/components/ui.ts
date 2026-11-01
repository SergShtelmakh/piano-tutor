// Shared class strings of the dark theme, so buttons and cards look the same on every screen.

export const card = 'rounded-2xl border border-line bg-surface';

/** Small caps heading above a group of items. */
export const sectionLabel = 'text-xs font-bold uppercase tracking-wider text-ink-muted';

const buttonBase =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 text-base disabled:cursor-not-allowed disabled:opacity-40';

export const buttonPrimary = `${buttonBase} bg-accent font-extrabold text-accent-ink hover:bg-accent-strong`;
export const buttonOutline = `${buttonBase} border-[1.5px] border-line-strong bg-transparent font-bold text-ink hover:bg-surface-raised`;
export const buttonDanger = `${buttonBase} bg-wrong font-extrabold text-bg hover:brightness-110`;

/** A compact variant for toolbars and cards. */
export const buttonSmall = 'min-h-11 rounded-xl px-4 text-sm';

/** A 48 px square icon button on a surface. */
export const buttonIcon =
  'inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface text-ink hover:bg-surface-raised disabled:opacity-40';

/** A pill used for filters and toggles; pressed state is `chipOn`. */
export const chip =
  'inline-flex min-h-11 items-center rounded-full border border-line px-4 text-sm font-bold text-ink-muted hover:text-ink';
export const chipOn =
  'inline-flex min-h-11 items-center rounded-full bg-accent px-4 text-sm font-bold text-accent-ink';

export const notice = 'rounded-xl bg-surface-raised px-4 py-3 text-sm text-ink';
