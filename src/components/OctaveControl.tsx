import { keyboardRange, MAX_BASE_OCTAVE, MIN_BASE_OCTAVE } from '../core/notes.ts';
import { useLocale, useT } from '../i18n/context.ts';
import { noteLabelFor } from '../i18n/noteNames.ts';
import { useBaseOctave } from '../input/context.ts';
import { buttonOutline, buttonSmall } from './ui.ts';

const buttonClass = `${buttonOutline} ${buttonSmall}`;

export default function OctaveControl() {
  const t = useT();
  const { locale } = useLocale();
  const { baseOctave, shiftBaseOctave } = useBaseOctave();
  const range = keyboardRange(baseOctave);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-ink-muted">{t('computerKeysLabel')}</span>
      <button
        type="button"
        className={buttonClass}
        disabled={baseOctave <= MIN_BASE_OCTAVE}
        onClick={() => shiftBaseOctave(-1)}
      >
        {t('octaveDown')}
      </button>
      <span className="min-w-16 text-center text-sm font-bold">
        {noteLabelFor(locale, range[0])}–{noteLabelFor(locale, range[range.length - 1])}
      </span>
      <button
        type="button"
        className={buttonClass}
        disabled={baseOctave >= MAX_BASE_OCTAVE}
        onClick={() => shiftBaseOctave(1)}
      >
        {t('octaveUp')}
      </button>
    </div>
  );
}
