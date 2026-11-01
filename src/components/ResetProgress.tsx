import { useState } from 'react';
import { useT } from '../i18n/context.ts';
import { useProgress } from '../progress/context.ts';
import { buttonDanger, buttonOutline, buttonSmall } from './ui.ts';

export default function ResetProgress() {
  const t = useT();
  const { reset } = useProgress();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={`${buttonOutline} ${buttonSmall}`}
      >
        {t('resetProgress')}
      </button>
    );
  }

  return (
    <div
      role="alertdialog"
      aria-label={t('resetProgress')}
      className="flex flex-col items-start gap-3"
    >
      <p className="text-sm text-ink">{t('resetConfirmText')}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => {
            reset();
            setConfirming(false);
          }}
          className={`${buttonDanger} ${buttonSmall}`}
        >
          {t('resetConfirm')}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className={`${buttonOutline} ${buttonSmall}`}
        >
          {t('resetCancel')}
        </button>
      </div>
    </div>
  );
}
