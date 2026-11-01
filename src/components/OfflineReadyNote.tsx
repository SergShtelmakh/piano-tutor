import { useT } from '../i18n/context.ts';
import { buttonOutline, buttonSmall } from './ui.ts';

export default function OfflineReadyNote({ onClose }: { onClose: () => void }) {
  const t = useT();
  return (
    <div
      role="status"
      className="flex items-center justify-between gap-3 rounded-2xl border border-line-strong bg-surface-raised px-4 py-3 text-sm text-ink shadow-2xl"
    >
      <span>{t('offlineReady')}</span>
      <button type="button" onClick={onClose} className={`${buttonOutline} ${buttonSmall}`}>
        {t('offlineReadyOk')}
      </button>
    </div>
  );
}
