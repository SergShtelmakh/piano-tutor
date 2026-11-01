import { LESSON_CATALOG, LESSON_UNITS, nextLessonId } from '../core/lessons.ts';
import { useT } from '../i18n/context.ts';
import { useProgress } from '../progress/context.ts';
import LearningPieces from './LearningPieces.tsx';
import LessonCard from './LessonCard.tsx';
import ResetProgress from './ResetProgress.tsx';
import { sectionLabel } from './ui.ts';

/** The built-in curriculum by unit, the pieces being learned, and Reset progress. */
export default function LessonsScreen({ onStart }: { onStart: (lessonId: string) => void }) {
  const t = useT();
  const { progress } = useProgress();
  const nextId = nextLessonId(LESSON_CATALOG, progress.lessons);

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      {LESSON_UNITS.map((unit) => (
        <section key={unit.id} className="flex w-full flex-col gap-3">
          <h2 className={`${sectionLabel} text-left`}>{t(unit.titleKey)}</h2>
          {unit.lessons.map((entry) => (
            <LessonCard
              key={entry.id}
              id={entry.id}
              title={t(entry.titleKey)}
              isNext={entry.id === nextId}
              onStart={() => onStart(entry.id)}
            />
          ))}
        </section>
      ))}
      <LearningPieces />
      <div className="flex justify-start">
        <ResetProgress />
      </div>
    </div>
  );
}
