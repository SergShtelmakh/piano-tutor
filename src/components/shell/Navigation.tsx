import { useT } from '../../i18n/context.ts';
import Logo from '../Logo.tsx';
import { NAV_ITEMS } from './navItems.ts';
import type { Screen } from './screens.ts';

/**
 * The navigation rail (from 768 px: icons with short labels) that becomes a sidebar from 1280 px
 * (logo and name, one row per screen). Hidden on phones, where Home has the tiles.
 */
export default function Navigation({
  current,
  onChange,
}: {
  current: Screen;
  onChange: (screen: Screen) => void;
}) {
  const t = useT();

  return (
    <nav
      aria-label={t('navLabel')}
      className="hidden w-28 shrink-0 flex-col items-center gap-2 border-r border-line bg-rail px-0 py-6 wide:flex sidebar:w-72 sidebar:items-stretch sidebar:px-5 sidebar:py-7"
    >
      <div className="mb-6 flex items-center gap-3 sidebar:px-2">
        <Logo size={48} />
        <span className="hidden text-xl font-extrabold tracking-tight sidebar:inline">
          {t('appName')}
        </span>
      </div>
      {NAV_ITEMS.map(({ screen, labelKey, Icon }) => {
        const on = screen === current;
        return (
          <button
            key={screen}
            type="button"
            aria-current={on ? 'page' : undefined}
            onClick={() => onChange(screen)}
            className={`flex h-20 w-24 flex-col items-center justify-center gap-1.5 rounded-2xl text-xs font-bold sidebar:h-13 sidebar:w-auto sidebar:flex-row sidebar:justify-start sidebar:gap-3.5 sidebar:px-4 sidebar:text-base ${
              on ? 'bg-accent-soft text-accent' : 'text-ink-muted hover:bg-surface hover:text-ink'
            }`}
          >
            <Icon size={28} />
            <span>{t(labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );
}
