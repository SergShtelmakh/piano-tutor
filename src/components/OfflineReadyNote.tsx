import { useT } from '../i18n/context.ts';

export default function OfflineReadyNote({ onClose }: { onClose: () => void }) {
  const t = useT();
  return (
    <div
      role="status"
      className="flex items-center justify-between gap-3 rounded-lg bg-slate-800 px-4 py-2 text-sm text-white shadow-lg"
    >
      <span>{t('offlineReady')}</span>
      <button
        type="button"
        onClick={onClose}
        className="rounded-md bg-white px-3 py-1 font-semibold text-slate-900 hover:bg-slate-200"
      >
        {t('offlineReadyOk')}
      </button>
    </div>
  );
}
