import { useT } from '../i18n/context.ts';
import { useInstallHint } from '../pwa/useInstallHint.ts';

/** Shown on Home only while the browser offers installation (FR-7). */
export default function InstallCard() {
  const t = useT();
  const { visible, install, dismiss } = useInstallHint('home');
  if (!visible) return null;

  return (
    <section
      aria-label={t('installTitle')}
      className="flex w-full flex-col items-center gap-2 rounded-lg bg-sky-50 px-4 py-3 shadow-sm"
    >
      <h2 className="font-semibold text-sky-900">{t('installTitle')}</h2>
      <p className="text-sm text-slate-700">{t('installText')}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => void install()}
          className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sky-700"
        >
          {t('installAction')}
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100"
        >
          {t('installNotNow')}
        </button>
      </div>
    </section>
  );
}
