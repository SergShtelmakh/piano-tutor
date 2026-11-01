import { useState } from 'react';
import CourseScreen from './components/CourseScreen.tsx';
import FreePlayScreen from './components/FreePlayScreen.tsx';
import HomeScreen from './components/HomeScreen.tsx';
import LessonScreen from './components/LessonScreen.tsx';
import LessonsScreen from './components/LessonsScreen.tsx';
import PlayerScreen from './components/PlayerScreen.tsx';
import PwaNotices from './components/PwaNotices.tsx';
import SettingsScreen from './components/SettingsScreen.tsx';
import AppShell from './components/shell/AppShell.tsx';
import ScreenHeader from './components/shell/ScreenHeader.tsx';
import type { Screen } from './components/shell/screens.ts';
import { LESSON_CATALOG } from './core/lessons.ts';
import { CourseProvider } from './course/CourseProvider.tsx';
import { useCourse } from './course/context.ts';
import { useT } from './i18n/context.ts';
import type { MessageKey } from './i18n/locales/en.ts';
import { MidiProvider } from './input/MidiProvider.tsx';
import { NoteInputProvider } from './input/NoteInputProvider.tsx';
import { KeyboardRangeProvider } from './keyboard/KeyboardRangeProvider.tsx';
import { LibraryMarksProvider } from './library/LibraryMarksProvider.tsx';
import { PlayerProvider } from './playback/PlayerProvider.tsx';
import { ProgressProvider } from './progress/ProgressProvider.tsx';

/** The screens. It sits inside the providers, so it can use the course state. */
function Shell() {
  const t = useT();
  const course = useCourse();
  const [screen, setScreen] = useState<Screen>('home');
  // The id of the open lesson; while set, it replaces every other screen (and the navigation).
  const [lessonId, setLessonId] = useState<string | null>(null);
  const catalogEntry = LESSON_CATALOG.find((item) => item.id === lessonId);
  const courseEntry = lessonId ? course.lessonById(lessonId) : undefined;
  const entry = catalogEntry ?? courseEntry;
  // The course screen replaces the current screen while a piece's course is open.
  const courseOpen = course.source !== null;

  const navigate = (next: Screen) => {
    setLessonId(null);
    course.closeCourse();
    setScreen(next);
  };

  if (entry) {
    return (
      <>
        <LessonScreen
          key={entry.id}
          entry={entry}
          // A lesson goes back to where it was opened from: the course, Lessons, or Home.
          onExit={() => setLessonId(null)}
          backKey={courseEntry ? 'lessonBackToCourse' : 'lessonBack'}
        />
        <PwaNotices lessonOpen />
      </>
    );
  }

  const titleKeys: Record<Exclude<Screen, 'home'>, MessageKey> = {
    lessons: 'screenLessons',
    library: 'screenLibrary',
    free: 'screenFree',
    settings: 'screenSettings',
  };

  return (
    <>
      <AppShell screen={screen} onNavigate={navigate}>
        {courseOpen ? (
          <CourseScreen onStart={setLessonId} onOpenInPlayer={() => navigate('library')} />
        ) : screen === 'home' ? (
          <HomeScreen onStart={setLessonId} onNavigate={navigate} />
        ) : (
          <>
            <ScreenHeader title={t(titleKeys[screen])} onBack={() => navigate('home')} />
            {screen === 'lessons' && <LessonsScreen onStart={setLessonId} />}
            {screen === 'library' && <PlayerScreen />}
            {screen === 'free' && <FreePlayScreen />}
            {screen === 'settings' && <SettingsScreen />}
          </>
        )}
      </AppShell>
      <PwaNotices lessonOpen={false} />
    </>
  );
}

export default function App() {
  return (
    <ProgressProvider>
      <NoteInputProvider>
        <MidiProvider>
          <KeyboardRangeProvider>
            <LibraryMarksProvider>
              <PlayerProvider>
                <CourseProvider>
                  <Shell />
                </CourseProvider>
              </PlayerProvider>
            </LibraryMarksProvider>
          </KeyboardRangeProvider>
        </MidiProvider>
      </NoteInputProvider>
    </ProgressProvider>
  );
}
