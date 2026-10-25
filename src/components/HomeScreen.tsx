import { LESSON_CATALOG } from '../core/lessons.ts';
import { useT } from '../i18n/context.ts';
import { useProgress } from '../progress/context.ts';
import LessonCard from './LessonCard.tsx';
import ResetProgress from './ResetProgress.tsx';
import StatsBar from './StatsBar.tsx';

export default function HomeScreen({ onStart }: { onStart: (lessonId: string) => void }) {
  const t = useT();
  const { storageAvailable } = useProgress();

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <StatsBar />
      {!storageAvailable && (
        <p role="status" className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {t('progressNotSaved')}
        </p>
      )}
      <h2 className="text-xl font-bold">{t('homeLessonsTitle')}</h2>
      {LESSON_CATALOG.map((entry) => (
        <LessonCard key={entry.id} entry={entry} onStart={() => onStart(entry.id)} />
      ))}
      <ResetProgress />
    </div>
  );
}
