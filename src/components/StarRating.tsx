import { MAX_STARS, type Stars } from '../core/progress.ts';
import { useT } from '../i18n/context.ts';

export default function StarRating({ stars }: { stars: Stars }) {
  const t = useT();

  return (
    <span role="img" aria-label={t('starsLabel', { stars })} className="text-xl tracking-wider">
      {Array.from({ length: MAX_STARS }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={i < stars ? 'text-amber-500' : 'text-slate-300'}
        >
          {i < stars ? '★' : '☆'}
        </span>
      ))}
    </span>
  );
}
