import { accuracy, type LessonState } from '../core/lesson.ts';
import { useLocale, usePluralT, useT } from '../i18n/context.ts';
import { formatPercent } from '../i18n/core.ts';

const buttonClass = 'rounded-lg px-4 py-2 text-sm font-semibold';

interface LessonSummaryProps {
  state: LessonState;
  onAgain: () => void;
  onExit: () => void;
}

export default function LessonSummary({ state, onAgain, onExit }: LessonSummaryProps) {
  const t = useT();
  const tp = usePluralT();
  const { locale } = useLocale();

  return (
    <section className="flex w-full flex-col items-center gap-3 rounded-lg bg-white px-4 py-6 shadow-sm">
      <h2 className="text-2xl font-bold">{t('summaryTitle')}</h2>
      <p className="text-3xl font-bold text-sky-700">
        {t('summaryAccuracy', { percent: formatPercent(locale, accuracy(state)) })}
      </p>
      <p className="text-slate-700">{tp('correctCount', state.correct)}</p>
      <p className="text-slate-700">{tp('mistakesCount', state.mistakes)}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onAgain}
          className={`${buttonClass} bg-sky-600 text-white hover:bg-sky-700`}
        >
          {t('summaryAgain')}
        </button>
        <button
          type="button"
          onClick={onExit}
          className={`${buttonClass} border border-slate-300 bg-white hover:bg-slate-100`}
        >
          {t('lessonBack')}
        </button>
      </div>
    </section>
  );
}
