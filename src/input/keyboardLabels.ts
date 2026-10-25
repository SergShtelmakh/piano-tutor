import { QWERTY_LABELS } from '../core/computerKeymap.ts';

type KeyboardLayoutNavigator = Navigator & {
  keyboard?: { getLayoutMap(): Promise<ReadonlyMap<string, string>> };
};

/**
 * Labels for the mapped computer keys, as printed on the user's layout when the
 * Keyboard Map API (Chromium, secure context) is available; QWERTY letters otherwise.
 */
export async function loadKeyLabels(): Promise<Record<string, string>> {
  try {
    const layout = await (navigator as KeyboardLayoutNavigator).keyboard?.getLayoutMap();
    if (!layout) return { ...QWERTY_LABELS };
    const labels: Record<string, string> = {};
    for (const [code, fallback] of Object.entries(QWERTY_LABELS)) {
      labels[code] = layout.get(code)?.toUpperCase() ?? fallback;
    }
    return labels;
  } catch {
    return { ...QWERTY_LABELS };
  }
}
