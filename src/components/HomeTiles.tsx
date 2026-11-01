import type { ComponentType } from 'react';
import { LESSON_CATALOG } from '../core/lessons.ts';
import { useT } from '../i18n/context.ts';
import type { MessageKey } from '../i18n/locales/en.ts';
import { useProgress } from '../progress/context.ts';
import { ChevronRightIcon, KeysIcon, LibraryIcon, NoteIcon, SlidersIcon } from './icons.tsx';
import type { Screen } from './shell/screens.ts';

interface Tile {
  screen: Exclude<Screen, 'home'>;
  titleKey: MessageKey;
  Icon: ComponentType<{ size?: number; className?: string }>;
  iconColor: string;
}

const OTHER_TILES: readonly Tile[] = [
  { screen: 'library', titleKey: 'screenLibrary', Icon: LibraryIcon, iconColor: 'text-warm' },
  { screen: 'free', titleKey: 'screenFree', Icon: KeysIcon, iconColor: 'text-accent' },
  { screen: 'settings', titleKey: 'screenSettings', Icon: SlidersIcon, iconColor: 'text-accent' },
];

const SUBTITLE_KEYS: Record<Tile['screen'], MessageKey> = {
  lessons: 'tileLessonsSub',
  library: 'tileLibrarySub',
  free: 'tileFreeSub',
  settings: 'tileSettingsSub',
};

/** Big tiles for the other screens: Lessons is the main one (teal), the rest are quiet cards. */
export default function HomeTiles({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const t = useT();
  const { progress } = useProgress();
  const finished = LESSON_CATALOG.filter((item) => progress.lessons[item.id] !== undefined).length;

  return (
    <div className="grid w-full grid-cols-2 gap-4">
      <button
        type="button"
        onClick={() => onNavigate('lessons')}
        className="col-span-2 flex min-h-32 items-center gap-4 rounded-3xl bg-accent px-5 text-left text-accent-ink hover:bg-accent-strong short:col-span-1 short:min-h-0 short:flex-col short:items-start short:justify-between short:py-4"
      >
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] bg-accent-ink/15">
          <NoteIcon size={34} />
        </span>
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="text-xl font-extrabold tracking-tight">{t('screenLessons')}</span>
          <span className="text-sm font-semibold">
            {t('tileLessonsSub', { finished, total: LESSON_CATALOG.length })}
          </span>
        </span>
        <ChevronRightIcon size={24} className="short:hidden" />
      </button>
      {OTHER_TILES.map(({ screen, titleKey, Icon, iconColor }) => (
        <button
          key={screen}
          type="button"
          onClick={() => onNavigate(screen)}
          className={`flex min-h-44 flex-col justify-between rounded-3xl border border-line bg-surface p-4 text-left hover:bg-surface-raised short:min-h-0 ${
            screen === 'settings' ? 'col-span-2 short:col-span-1' : ''
          }`}
        >
          <span
            className={`flex h-14 w-14 items-center justify-center rounded-[18px] bg-surface-raised ${iconColor}`}
          >
            <Icon size={30} />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-lg font-extrabold">{t(titleKey)}</span>
            <span className="text-sm font-medium text-ink-muted">{t(SUBTITLE_KEYS[screen])}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
