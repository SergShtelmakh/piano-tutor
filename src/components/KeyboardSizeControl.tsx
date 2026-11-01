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
  'min-h-11 rounded-xl border border-line-strong bg-transparent px-3 text-sm font-bold text-ink hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40';
const activeClass = '!border-accent !bg-accent-soft !text-accent';

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
    <div className="flex w-full flex-col items-start gap-3">
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
          className="flex w-full max-w-md flex-col items-start gap-4 rounded-2xl bg-bg p-4"
        >
          <h3 className="font-bold text-ink">{t('keyboardPanelTitle')}</h3>

          {step ? (
            <div className="flex flex-col items-start gap-3">
              <p role="status" className="text-ink">
                {step.step === 'lowest' && t('keyboardCalibrateLowest')}
                {step.step === 'highest' && t('keyboardCalibrateHighest')}
                {step.step === 'done' &&
                  tp(
                    'keyboardCalibrateResult',
                    keyCount(step.range),
                    names(step.range.low, step.range.high),
                  )}
              </p>
              <div className="flex flex-wrap gap-2">
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
                className="flex flex-wrap gap-2"
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

              <div className="flex flex-wrap gap-2">
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

              <div className="flex flex-col items-start gap-1">
                <button
                  type="button"
                  className={buttonClass}
                  disabled={!connected}
                  onClick={calibration.start}
                >
                  {t('keyboardCalibrate')}
                </button>
                {!connected && (
                  <p className="text-sm text-ink-muted">{t('keyboardCalibrateNeedsMidi')}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
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
