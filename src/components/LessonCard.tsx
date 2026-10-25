import type { LessonEntry } from '../core/lessons.ts';
import { usePluralT, useLocale, useT } from '../i18n/context.ts';
import { formatPercent } from '../i18n/core.ts';
import { useProgress } from '../progress/context.ts';
import StarRating from './StarRating.tsx';

export default function LessonCard({
  entry,
  onStart,
}: {
  entry: LessonEntry;
  onStart: () => void;
}) {
  const t = useT();
  const tp = usePluralT();
  const { locale } = useLocale();
  const record = useProgress().progress.lessons[entry.id];

  return (
    <article className="flex w-full flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-4 text-left shadow-sm">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-bold">{t(entry.titleKey)}</h3>
        <StarRating stars={record?.bestStars ?? 0} />
        <p className="text-sm text-slate-700">
          {record
            ? `${t('lessonBestAccuracy', { percent: formatPercent(locale, record.bestAccuracy) })} · ${tp('runsCount', record.completions)}`
            : t('lessonNotPlayed')}
        </p>
      </div>
      <button
        type="button"
        onClick={onStart}
        className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
      >
        {t('lessonStart')}
      </button>
    </article>
  );
}
