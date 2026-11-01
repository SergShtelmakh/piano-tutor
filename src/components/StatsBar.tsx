import { currentStreak, levelProgress } from '../core/progress.ts';
import { usePluralT, useT } from '../i18n/context.ts';
import { useProgress } from '../progress/context.ts';
import { localDay } from '../progress/today.ts';
import { card } from './ui.ts';

export default function StatsBar() {
  const t = useT();
  const tp = usePluralT();
  const { progress } = useProgress();
  const { level, into, needed } = levelProgress(progress.xp);

  return (
    <section className={`${card} flex w-full flex-col gap-3 p-4 text-left`}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xl font-extrabold text-accent">{t('statsLevel', { level })}</p>
        <p className="text-sm text-ink-muted">{t('statsXp', { into, needed })}</p>
      </div>
      <div
        role="progressbar"
        aria-label={t('statsXpBarLabel')}
        aria-valuemin={0}
        aria-valuemax={needed}
        aria-valuenow={into}
        className="h-2 w-full overflow-hidden rounded-full bg-line"
      >
        <div
          className="h-full rounded-full bg-warm"
          style={{ width: `${(into / needed) * 100}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-muted">
        <span>
          {t('statsStreakLabel')}:{' '}
          <strong className="text-ink">
            {tp('streakCount', currentStreak(progress, localDay()))}
          </strong>
        </span>
        <span>
          {t('statsBestStreakLabel')}:{' '}
          <strong className="text-ink">{tp('streakCount', progress.streak.best)}</strong>
        </span>
      </div>
    </section>
  );
}
