import { usePluralT, useLocale, useT } from '../i18n/context.ts';
import { formatPercent } from '../i18n/core.ts';
import { useProgress } from '../progress/context.ts';
import { NoteIcon } from './icons.tsx';
import StarRating from './StarRating.tsx';
import { buttonPrimary, buttonSmall, card } from './ui.ts';

export default function LessonCard({
  id,
  title,
  detail,
  isNext = false,
  onStart,
}: {
  /** The id the results are saved under. */
  id: string;
  /** The translated title. */
  title: string;
  /** A short line under the title, such as the number of steps. */
  detail?: string;
  isNext?: boolean;
  onStart: () => void;
}) {
  const t = useT();
  const tp = usePluralT();
  const { locale } = useLocale();
  const record = useProgress().progress.lessons[id];

  return (
    <article
      className={`flex w-full items-center gap-4 p-4 text-left ${
        isNext ? 'rounded-2xl border-[1.5px] border-accent bg-accent-soft' : card
      }`}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-raised text-accent">
        <NoteIcon size={24} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base font-bold">
          {title}
          {isNext && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-extrabold text-accent-ink">
              {t('lessonNextBadge')}
            </span>
          )}
        </h3>
        {detail && <p className="text-sm text-ink-muted">{detail}</p>}
        <StarRating stars={record?.bestStars ?? 0} />
        <p className="text-sm text-ink-muted">
          {record
            ? `${t('lessonBestAccuracy', { percent: formatPercent(locale, record.bestAccuracy) })} · ${tp('runsCount', record.completions)}`
            : t('lessonNotPlayed')}
        </p>
      </div>
      <button type="button" onClick={onStart} className={`${buttonPrimary} ${buttonSmall}`}>
        {t('lessonStart')}
      </button>
    </article>
  );
}
