import { useSyncExternalStore } from 'react';
import { getSheetStyle, subscribeSheetStyle, type SheetStyle } from './sheetStyle.ts';

/** The notation style the learner chose (the same value in every view). */
export function useSheetStyle(): SheetStyle {
  return useSyncExternalStore(subscribeSheetStyle, getSheetStyle);
}
