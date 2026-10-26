import { useT } from '../i18n/context.ts';

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
      className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-lg bg-slate-800 px-4 py-2 text-sm text-white shadow-lg"
    >
      <span>{t('updateAvailable')}</span>
      <span className="flex gap-2">
        <button
          type="button"
          onClick={onReload}
          className="rounded-md bg-sky-500 px-3 py-1 font-semibold text-white hover:bg-sky-400"
        >
          {t('updateReload')}
        </button>
        <button
          type="button"
          onClick={onLater}
          className="rounded-md border border-slate-500 px-3 py-1 hover:bg-slate-700"
        >
          {t('updateLater')}
        </button>
      </span>
    </div>
  );
}
