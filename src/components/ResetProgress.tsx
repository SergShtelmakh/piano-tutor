import { useState } from 'react';
import { useT } from '../i18n/context.ts';
import { useProgress } from '../progress/context.ts';

const buttonClass =
  'rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100';

export default function ResetProgress() {
  const t = useT();
  const { reset } = useProgress();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className={buttonClass}>
        {t('resetProgress')}
      </button>
    );
  }

  return (
    <div
      role="alertdialog"
      aria-label={t('resetProgress')}
      className="flex flex-col items-center gap-2"
    >
      <p className="text-sm text-slate-700">{t('resetConfirmText')}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => {
            reset();
            setConfirming(false);
          }}
          className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
        >
          {t('resetConfirm')}
        </button>
        <button type="button" onClick={() => setConfirming(false)} className={buttonClass}>
          {t('resetCancel')}
        </button>
      </div>
    </div>
  );
}
