import { useState } from 'react';
import { LESSON_CATALOG, LESSON_UNITS, nextLessonId } from '../core/lessons.ts';
import { useT } from '../i18n/context.ts';
import { useProgress } from '../progress/context.ts';
import AddLessonSheet from './AddLessonSheet.tsx';
import { PlusIcon } from './icons.tsx';
import LessonCard from './LessonCard.tsx';
import MyLessonsList from './MyLessonsList.tsx';
import ResetProgress from './ResetProgress.tsx';
import type { Screen } from './shell/screens.ts';
import { buttonPrimary, sectionLabel } from './ui.ts';

/** My lessons (the learner's pieces), Add lesson, the built-in curriculum as Basics, Reset progress. */
export default function LessonsScreen({
  onStart,
  onNavigate,
}: {
  onStart: (lessonId: string) => void;
  onNavigate: (screen: Screen) => void;
}) {
  const t = useT();
  const { progress } = useProgress();
  const nextId = nextLessonId(LESSON_CATALOG, progress.lessons);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <MyLessonsList />
      <button
        type="button"
        className={`${buttonPrimary} min-h-14 w-full text-lg`}
        onClick={() => setSheetOpen(true)}
      >
        <PlusIcon size={24} />
        {t('myLessonsAdd')}
      </button>
      <AddLessonSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onChooseLibrary={() => onNavigate('library')}
      />

      <h2 className="text-xl font-extrabold tracking-tight">{t('myLessonsBasics')}</h2>
      {LESSON_UNITS.map((unit) => (
        <section key={unit.id} className="flex w-full flex-col gap-3">
          <h3 className={`${sectionLabel} text-left`}>{t(unit.titleKey)}</h3>
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
      <div className="flex justify-start">
        <ResetProgress />
      </div>
    </div>
  );
}
