import { accuracy, type LessonState } from '../core/lesson.ts';
import type { RunReward } from '../core/progress.ts';
import type { MessageKey } from '../i18n/locales/en.ts';
import { useLocale, usePluralT, useT } from '../i18n/context.ts';
import { formatPercent } from '../i18n/core.ts';
import StarRating from './StarRating.tsx';
import { buttonOutline, buttonPrimary, card } from './ui.ts';

interface LessonSummaryProps {
  state: LessonState;
  reward: RunReward | null;
  onAgain: () => void;
  onExit: () => void;
  /** The label of the exit button: back (default) or back to the course. */
  exitKey?: MessageKey;
  /** One hand was played: nothing was saved. */
  practice?: boolean;
}

export default function LessonSummary({
  state,
  reward,
  onAgain,
  onExit,
  exitKey = 'lessonBack',
  practice = false,
}: LessonSummaryProps) {
  const t = useT();
  const tp = usePluralT();
  const { locale } = useLocale();

  return (
    <section className={`${card} flex w-full max-w-xl flex-col items-center gap-3 px-4 py-8`}>
      <h2 className="text-2xl font-extrabold">{t('summaryTitle')}</h2>
      {reward && <StarRating stars={reward.stars} />}
      <p className="text-3xl font-extrabold text-accent">
        {t('summaryAccuracy', { percent: formatPercent(locale, accuracy(state)) })}
      </p>
      {reward?.newBestAccuracy && (
        <p className="font-bold text-warm">{t('rewardNewBestAccuracy')}</p>
      )}
      <p className="text-ink">{tp('correctCount', state.correct)}</p>
      <p className="text-ink">{tp('mistakesCount', state.mistakes)}</p>
      {practice && <p className="text-sm text-ink-muted">{t('summaryPractice')}</p>}
      {reward && (
        <div className="flex flex-col items-center gap-1 border-t border-line pt-3">
          <p className="text-xl font-extrabold text-warm">
            {t('rewardXp', { xp: reward.xpGained })}
          </p>
          {reward.levelAfter > reward.levelBefore && (
            <p className="font-bold text-accent">
              {t('rewardLevelUp', { level: reward.levelAfter })}
            </p>
          )}
          <p className="text-ink">
            {t('rewardStreak')} {tp('streakCount', reward.streak)}
          </p>
          {reward.newBestStreak && (
            <p className="font-bold text-warm">{t('rewardNewBestStreak')}</p>
          )}
        </div>
      )}
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={onAgain} className={buttonPrimary}>
          {t('summaryAgain')}
        </button>
        <button type="button" onClick={onExit} className={buttonOutline}>
          {t(exitKey)}
        </button>
      </div>
    </section>
  );
}
