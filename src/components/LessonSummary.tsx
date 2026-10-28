import { accuracy, type LessonState } from '../core/lesson.ts';
import type { RunReward } from '../core/progress.ts';
import type { MessageKey } from '../i18n/locales/en.ts';
import { useLocale, usePluralT, useT } from '../i18n/context.ts';
import { formatPercent } from '../i18n/core.ts';
import StarRating from './StarRating.tsx';

const buttonClass = 'rounded-lg px-4 py-2 text-sm font-semibold';

interface LessonSummaryProps {
  state: LessonState;
  reward: RunReward | null;
  onAgain: () => void;
  onExit: () => void;
  /** The label of the exit button: back to Home (default) or back to the course. */
  exitKey?: MessageKey;
}

export default function LessonSummary({
  state,
  reward,
  onAgain,
  onExit,
  exitKey = 'lessonBack',
}: LessonSummaryProps) {
  const t = useT();
  const tp = usePluralT();
  const { locale } = useLocale();

  return (
    <section className="flex w-full flex-col items-center gap-3 rounded-lg bg-white px-4 py-6 shadow-sm">
      <h2 className="text-2xl font-bold">{t('summaryTitle')}</h2>
      {reward && <StarRating stars={reward.stars} />}
      <p className="text-3xl font-bold text-sky-700">
        {t('summaryAccuracy', { percent: formatPercent(locale, accuracy(state)) })}
      </p>
      {reward?.newBestAccuracy && (
        <p className="font-semibold text-amber-700">{t('rewardNewBestAccuracy')}</p>
      )}
      <p className="text-slate-700">{tp('correctCount', state.correct)}</p>
      <p className="text-slate-700">{tp('mistakesCount', state.mistakes)}</p>
      {reward && (
        <div className="flex flex-col items-center gap-1 border-t border-slate-200 pt-3">
          <p className="text-xl font-bold text-emerald-700">
            {t('rewardXp', { xp: reward.xpGained })}
          </p>
          {reward.levelAfter > reward.levelBefore && (
            <p className="font-semibold text-sky-700">
              {t('rewardLevelUp', { level: reward.levelAfter })}
            </p>
          )}
          <p className="text-slate-700">
            {t('rewardStreak')} {tp('streakCount', reward.streak)}
          </p>
          {reward.newBestStreak && (
            <p className="font-semibold text-amber-700">{t('rewardNewBestStreak')}</p>
          )}
        </div>
      )}
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
          {t(exitKey)}
        </button>
      </div>
    </section>
  );
}
