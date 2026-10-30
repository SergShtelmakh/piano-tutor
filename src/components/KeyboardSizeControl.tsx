import { useId, useState } from 'react';
import {
  KEY_COUNTS,
  canShift,
  keyCount,
  rangeForKeyCount,
  shiftRange,
  standardKeyCount,
} from '../core/keyboardRange.ts';
import { useLocale, usePluralT, useT } from '../i18n/context.ts';
import { noteLabelFor } from '../i18n/noteNames.ts';
import { useKeyboardRange } from '../keyboard/context.ts';
import { useCalibration } from '../keyboard/useCalibration.ts';

const buttonClass =
  'min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white';
const activeClass = 'border-sky-600 bg-sky-50 text-sky-800';

/** The Keyboard button and its panel: how many keys the learner's real keyboard has. */
export default function KeyboardSizeControl({ connected }: { connected: boolean }) {
  const t = useT();
  const tp = usePluralT();
  const { locale } = useLocale();
  const { range, setRange } = useKeyboardRange();
  const calibration = useCalibration(connected);
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const names = (low: number, high: number) => ({
    low: noteLabelFor(locale, low),
    high: noteLabelFor(locale, high),
  });
  const label = range
    ? tp('keyboardButtonSet', keyCount(range), names(range.low, range.high))
    : t('keyboardButtonNotSet');
  const standard = range ? standardKeyCount(range) : undefined;
  const step = calibration.state;

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <button
        type="button"
        className={buttonClass}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          if (open) calibration.cancel();
          setOpen(!open);
        }}
      >
        {label}
      </button>

      {open && (
        <section
          id={panelId}
          aria-label={t('keyboardPanelTitle')}
          className="flex w-full max-w-md flex-col items-center gap-3 rounded-lg bg-white p-3 shadow-sm"
        >
          <h3 className="font-semibold text-slate-800">{t('keyboardPanelTitle')}</h3>

          {step ? (
            <div className="flex flex-col items-center gap-3">
              <p role="status" className="text-slate-800">
                {step.step === 'lowest' && t('keyboardCalibrateLowest')}
                {step.step === 'highest' && t('keyboardCalibrateHighest')}
                {step.step === 'done' &&
                  tp(
                    'keyboardCalibrateResult',
                    keyCount(step.range),
                    names(step.range.low, step.range.high),
                  )}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {step.step === 'done' && (
                  <>
                    <button
                      type="button"
                      className={`${buttonClass} ${activeClass}`}
                      onClick={() => {
                        setRange(step.range);
                        calibration.cancel();
                      }}
                    >
                      {t('keyboardSave')}
                    </button>
                    <button type="button" className={buttonClass} onClick={calibration.start}>
                      {t('keyboardTryAgain')}
                    </button>
                  </>
                )}
                <button type="button" className={buttonClass} onClick={calibration.cancel}>
                  {t('keyboardCancel')}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div
                role="group"
                aria-label={t('keyboardCountGroup')}
                className="flex flex-wrap justify-center gap-2"
              >
                {KEY_COUNTS.map((count) => (
                  <button
                    key={count}
                    type="button"
                    aria-pressed={standard === count}
                    className={`${buttonClass} min-w-11 ${standard === count ? activeClass : ''}`}
                    onClick={() => setRange(rangeForKeyCount(count))}
                  >
                    {count}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  className={buttonClass}
                  disabled={!range || !canShift(range, -1)}
                  onClick={() => range && setRange(shiftRange(range, -1))}
                >
                  {t('keyboardOctaveDown')}
                </button>
                <button
                  type="button"
                  className={buttonClass}
                  disabled={!range || !canShift(range, 1)}
                  onClick={() => range && setRange(shiftRange(range, 1))}
                >
                  {t('keyboardOctaveUp')}
                </button>
              </div>

              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  className={buttonClass}
                  disabled={!connected}
                  onClick={calibration.start}
                >
                  {t('keyboardCalibrate')}
                </button>
                {!connected && (
                  <p className="text-sm text-slate-600">{t('keyboardCalibrateNeedsMidi')}</p>
                )}
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  className={buttonClass}
                  disabled={!range}
                  onClick={() => setRange(null)}
                >
                  {t('keyboardClear')}
                </button>
                <button type="button" className={buttonClass} onClick={() => setOpen(false)}>
                  {t('keyboardClose')}
                </button>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
