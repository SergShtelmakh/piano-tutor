import type { LayoutSize } from '../core/lessonLayout.ts';
import type { MessageKey } from '../i18n/locales/en.ts';

/** The spoken name of each size ("M" is "Medium"). */
export const SIZE_NAME_KEYS: Record<LayoutSize, MessageKey> = {
  s: 'layoutSizeS',
  m: 'layoutSizeM',
  l: 'layoutSizeL',
  xl: 'layoutSizeXl',
};
