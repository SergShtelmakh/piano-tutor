const KEY = 'piano-tutor.sheetStyle';

export type SheetStyle = 'paper' | 'dark';

export const DEFAULT_SHEET_STYLE: SheetStyle = 'paper';

/** Saved style, or paper if nothing valid is saved or storage is unavailable. */
export function loadSheetStyle(): SheetStyle {
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : DEFAULT_SHEET_STYLE;
  } catch {
    return DEFAULT_SHEET_STYLE;
  }
}

/** Best effort: failures (blocked or full storage) are ignored. */
function saveSheetStyle(style: SheetStyle): void {
  try {
    localStorage.setItem(KEY, style);
  } catch {
    // The style still applies for this session.
  }
}

let current: SheetStyle = loadSheetStyle();
const listeners = new Set<() => void>();

export function getSheetStyle(): SheetStyle {
  return current;
}

/** Applies the style to every notation view at once and saves it. */
export function setSheetStyle(style: SheetStyle): void {
  if (style === current) return;
  current = style;
  saveSheetStyle(style);
  listeners.forEach((listener) => listener());
}

export function subscribeSheetStyle(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
