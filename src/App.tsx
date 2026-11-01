import { useCallback, useEffect, useRef, useState } from 'react';
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
import { nextCourseLesson, pieceIdOfLesson } from './core/course.ts';
import { LESSON_CATALOG } from './core/lessons.ts';
import { LIBRARY_PIECES } from './core/libraryCatalog.ts';
import type { MyLessonEntry } from './core/myLessons.ts';
import { CourseProvider } from './course/CourseProvider.tsx';
import { useCourse } from './course/context.ts';
import { useT } from './i18n/context.ts';
import type { MessageKey } from './i18n/locales/en.ts';
import { MidiProvider } from './input/MidiProvider.tsx';
import { NoteInputProvider } from './input/NoteInputProvider.tsx';
import { KeyboardRangeProvider } from './keyboard/KeyboardRangeProvider.tsx';
import { LibraryMarksProvider } from './library/LibraryMarksProvider.tsx';
import { useMyLessons } from './myLessons/context.ts';
import { MyLessonsProvider } from './myLessons/MyLessonsProvider.tsx';
import { PlayerProvider } from './playback/PlayerProvider.tsx';
import { useProgress } from './progress/context.ts';
import { ProgressProvider } from './progress/ProgressProvider.tsx';

/** The screens. It sits inside the providers, so it can use the course state. */
function Shell() {
  const t = useT();
  const course = useCourse();
  const { progress, setLastLesson } = useProgress();
  const { markPlayed } = useMyLessons();
  const [screen, setScreen] = useState<Screen>('home');
  // The id of the open lesson; while set, it replaces every other screen (and the navigation).
  const [lessonId, setLessonId] = useState<string | null>(null);

  // Opening a lesson makes it the one Continue picks up from, and its piece the latest played.
  const openLesson = useCallback(
    (id: string) => {
      setLastLesson(id);
      const pieceId = pieceIdOfLesson(id);
      if (pieceId !== null) markPlayed(pieceId);
      setLessonId(id);
    },
    [setLastLesson, markPlayed],
  );

  // Continue on a piece: open its course, and start its next lesson once the course is ready.
  const pendingContinue = useRef<{ pieceId: string; lastLessonId: string } | null>(null);
  const continuePiece = (entry: MyLessonEntry, lastLessonId: string) => {
    const piece = LIBRARY_PIECES.find((item) => item.id === entry.id);
    if (entry.source === 'library' && !piece) return;
    pendingContinue.current = { pieceId: entry.id, lastLessonId };
    if (piece) course.openCourse(piece);
    else course.openStoredFile({ id: entry.id, title: entry.title });
  };
  const { source: courseSource, status: courseStatus, course: builtCourse } = course;
  useEffect(() => {
    const pending = pendingContinue.current;
    if (!pending) return;
    // The course was closed, or it failed to load (its screen shows the error): give up.
    if (courseSource === null || courseStatus === 'error') {
      pendingContinue.current = null;
      return;
    }
    if (courseStatus === 'ready' && builtCourse?.pieceId === pending.pieceId) {
      pendingContinue.current = null;
      const next = nextCourseLesson(builtCourse, progress.lessons, pending.lastLessonId);
      if (next) openLesson(next.id);
    }
  }, [courseSource, courseStatus, builtCourse, progress.lessons, openLesson]);
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
          <CourseScreen onStart={openLesson} onOpenInPlayer={() => navigate('library')} />
        ) : screen === 'home' ? (
          <HomeScreen onStart={openLesson} onContinuePiece={continuePiece} onNavigate={navigate} />
        ) : (
          <>
            <ScreenHeader title={t(titleKeys[screen])} onBack={() => navigate('home')} />
            {screen === 'lessons' && <LessonsScreen onStart={openLesson} onNavigate={navigate} />}
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
                <MyLessonsProvider>
                  <CourseProvider>
                    <Shell />
                  </CourseProvider>
                </MyLessonsProvider>
              </PlayerProvider>
            </LibraryMarksProvider>
          </KeyboardRangeProvider>
        </MidiProvider>
      </NoteInputProvider>
    </ProgressProvider>
  );
}
