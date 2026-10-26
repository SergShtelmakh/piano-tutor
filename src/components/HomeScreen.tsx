import { LESSON_CATALOG, LESSON_UNITS, nextLessonId } from '../core/lessons.ts';
import { useT } from '../i18n/context.ts';
import { useProgress } from '../progress/context.ts';
import InstallCard from './InstallCard.tsx';
import LessonCard from './LessonCard.tsx';
import ResetProgress from './ResetProgress.tsx';
import StatsBar from './StatsBar.tsx';

export default function HomeScreen({ onStart }: { onStart: (lessonId: string) => void }) {
  const t = useT();
  const { progress, storageAvailable } = useProgress();
  const nextId = nextLessonId(LESSON_CATALOG, progress.lessons);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <InstallCard />
      <StatsBar />
      {!storageAvailable && (
        <p role="status" className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {t('progressNotSaved')}
        </p>
      )}
      <h2 className="text-xl font-bold">{t('homeLessonsTitle')}</h2>
      {LESSON_UNITS.map((unit) => (
        <section key={unit.id} className="flex w-full flex-col items-center gap-3">
          <h3 className="w-full text-left text-lg font-semibold text-slate-800">
            {t(unit.titleKey)}
          </h3>
          {unit.lessons.map((entry) => (
            <LessonCard
              key={entry.id}
              entry={entry}
              isNext={entry.id === nextId}
              onStart={() => onStart(entry.id)}
            />
          ))}
        </section>
      ))}
      <ResetProgress />
    </div>
  );
}
