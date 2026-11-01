import type { ComponentType } from 'react';
import type { MessageKey } from '../../i18n/locales/en.ts';
import { HomeIcon, KeysIcon, LibraryIcon, NoteIcon, SlidersIcon } from '../icons.tsx';
import type { Screen } from './screens.ts';

export interface NavItem {
  screen: Screen;
  labelKey: MessageKey;
  Icon: ComponentType<{ size?: number; className?: string }>;
}

/** The top-level screens, in navigation order. Home is also the phone's start screen. */
export const NAV_ITEMS: readonly NavItem[] = [
  { screen: 'home', labelKey: 'screenHome', Icon: HomeIcon },
  { screen: 'lessons', labelKey: 'screenLessons', Icon: NoteIcon },
  { screen: 'library', labelKey: 'screenLibrary', Icon: LibraryIcon },
  { screen: 'free', labelKey: 'screenFree', Icon: KeysIcon },
  { screen: 'settings', labelKey: 'screenSettings', Icon: SlidersIcon },
];
