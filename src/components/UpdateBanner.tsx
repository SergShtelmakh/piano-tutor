import { useT } from '../i18n/context.ts';
import { buttonOutline, buttonPrimary, buttonSmall } from './ui.ts';

export default function UpdateBanner({
  onReload,
  onLater,
}: {
  onReload: () => void;
  onLater: () => void;
}) {
  const t = useT();
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-2xl border border-line-strong bg-surface-raised px-4 py-3 text-sm text-ink shadow-2xl"
    >
      <span>{t('updateAvailable')}</span>
      <span className="flex gap-2">
        <button type="button" onClick={onReload} className={`${buttonPrimary} ${buttonSmall}`}>
          {t('updateReload')}
        </button>
        <button type="button" onClick={onLater} className={`${buttonOutline} ${buttonSmall}`}>
          {t('updateLater')}
        </button>
      </span>
    </div>
  );
}
