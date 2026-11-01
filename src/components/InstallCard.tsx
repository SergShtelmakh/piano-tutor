import { useT } from '../i18n/context.ts';
import { useInstallHint } from '../pwa/useInstallHint.ts';
import { buttonOutline, buttonPrimary, buttonSmall } from './ui.ts';

/** Shown on Home only while the browser offers installation (FR-7). */
export default function InstallCard() {
  const t = useT();
  const { visible, install, dismiss } = useInstallHint('home');
  if (!visible) return null;

  return (
    <section
      aria-label={t('installTitle')}
      className="flex w-full flex-col gap-3 rounded-2xl border border-accent bg-accent-soft p-4 text-left"
    >
      <h2 className="font-bold text-accent">{t('installTitle')}</h2>
      <p className="text-sm text-ink">{t('installText')}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => void install()}
          className={`${buttonPrimary} ${buttonSmall}`}
        >
          {t('installAction')}
        </button>
        <button type="button" onClick={dismiss} className={`${buttonOutline} ${buttonSmall}`}>
          {t('installNotNow')}
        </button>
      </div>
    </section>
  );
}
