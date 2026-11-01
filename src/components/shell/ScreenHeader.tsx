import type { ReactNode } from 'react';
import { useT } from '../../i18n/context.ts';
import { BackIcon } from '../icons.tsx';
import { buttonIcon } from '../ui.ts';

/** The title of a top-level screen; on phones (no rail) it has a Back button to Home. */
export default function ScreenHeader({
  title,
  onBack,
  actions,
}: {
  title: string;
  onBack: () => void;
  actions?: ReactNode;
}) {
  const t = useT();

  return (
    <header className="flex items-center gap-2 py-4 wide:py-8">
      <button
        type="button"
        onClick={onBack}
        aria-label={t('back')}
        className={`${buttonIcon} -ml-2 wide:hidden`}
      >
        <BackIcon size={26} />
      </button>
      <h1 className="flex-1 text-left text-2xl font-extrabold tracking-tight wide:text-4xl">
        {title}
      </h1>
      {actions}
    </header>
  );
}
