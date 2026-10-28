import { DIFFICULTIES, DIFFICULTY_KEYS } from '../core/library.ts';
import type { Difficulty } from '../core/libraryCatalog.ts';
import { useT } from '../i18n/context.ts';

/** The difficulty as filled dots and as text, so it never depends on colour alone. */
export default function DifficultyDots({ level }: { level: Difficulty }) {
  const t = useT();
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span aria-hidden="true" className="inline-flex gap-0.5">
        {DIFFICULTIES.map((dot) => (
          <span
            key={dot}
            className={`h-2 w-2 rounded-full ${dot <= level ? 'bg-sky-600' : 'bg-slate-300'}`}
          />
        ))}
      </span>
      <span>{t(DIFFICULTY_KEYS[level])}</span>
    </span>
  );
}
