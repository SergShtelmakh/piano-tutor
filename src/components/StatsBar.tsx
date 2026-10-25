import { currentStreak, levelProgress } from '../core/progress.ts';
import { usePluralT, useT } from '../i18n/context.ts';
import { useProgress } from '../progress/context.ts';
import { localDay } from '../progress/today.ts';

export default function StatsBar() {
  const t = useT();
  const tp = usePluralT();
  const { progress } = useProgress();
  const { level, into, needed } = levelProgress(progress.xp);

  return (
    <section className="flex w-full flex-col gap-3 rounded-lg bg-white p-4 text-left shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-2xl font-bold text-sky-700">{t('statsLevel', { level })}</p>
        <p className="text-sm text-slate-700">{t('statsXp', { into, needed })}</p>
      </div>
      <div
        role="progressbar"
        aria-label={t('statsXpBarLabel')}
        aria-valuemin={0}
        aria-valuemax={needed}
        aria-valuenow={into}
        className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200"
      >
        <div className="h-full bg-sky-600" style={{ width: `${(into / needed) * 100}%` }} />
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-700">
        <span>
          {t('statsStreakLabel')}:{' '}
          <strong>{tp('streakCount', currentStreak(progress, localDay()))}</strong>
        </span>
        <span>
          {t('statsBestStreakLabel')}: <strong>{tp('streakCount', progress.streak.best)}</strong>
        </span>
      </div>
    </section>
  );
}
