import { useCallback, useEffect, useRef, useState } from 'react';
import CourseScreen from './components/CourseScreen.tsx';
import FreePlayScreen from './components/FreePlayScreen.tsx';
import HomeScreen from './components/HomeScreen.tsx';
import LayoutEditorScreen from './components/LayoutEditorScreen.tsx';
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
import type { Route } from './core/route.ts';
import { CourseProvider } from './course/CourseProvider.tsx';
import { sourceId, useCourse } from './course/context.ts';
import { useT } from './i18n/context.ts';
import type { MessageKey } from './i18n/locales/en.ts';
import { MidiProvider } from './input/MidiProvider.tsx';
import { NoteInputProvider } from './input/NoteInputProvider.tsx';
import { KeyboardRangeProvider } from './keyboard/KeyboardRangeProvider.tsx';
import { LessonSettingsProvider } from './lesson/LessonSettingsProvider.tsx';
import { LibraryMarksProvider } from './library/LibraryMarksProvider.tsx';
import { useMyLessons } from './myLessons/context.ts';
import { appHistory } from './navigation/history.ts';
import { MyLessonsProvider } from './myLessons/MyLessonsProvider.tsx';
import { PlayerProvider } from './playback/PlayerProvider.tsx';
import { useProgress } from './progress/context.ts';
import { ProgressProvider } from './progress/ProgressProvider.tsx';

/** The screens. It sits inside the providers, so it can use the course state. */
function Shell() {
  const t = useT();
  const course = useCourse();
  const { progress, setLastLesson } = useProgress();
  const { markPlayed, entries: myLessons } = useMyLessons();
  // Where the address says the app starts; a course in it is opened once it is found (below).
  const [initial] = useState(() => appHistory.start());
  const [screen, setScreen] = useState<Screen>(initial.screen);
  const [pendingCourse, setPendingCourse] = useState<string | null>(initial.course);
  // The lesson layout editor, opened from Settings: a full-window screen like a lesson.
  const [layoutEditorOpen, setLayoutEditorOpen] = useState(false);
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

  // Opens the course with this id, or closes the course when it is not a library piece or a kept
  // file (a file opened from disk and not kept cannot come back).
  const openCourseById = (id: string) => {
    const piece = LIBRARY_PIECES.find((item) => item.id === id);
    const kept = myLessons.find((item) => item.id === id && item.source === 'file');
    if (piece) course.openCourse(piece);
    else if (kept) course.openStoredFile({ id: kept.id, title: kept.title });
    else course.closeCourse();
  };
  const startCourse = useRef<(id: string) => void>(openCourseById);
  useEffect(() => {
    startCourse.current = openCourseById;
  });
  useEffect(() => {
    if (pendingCourse === null) return;
    startCourse.current(pendingCourse);
    // Once the course is open (or was not found) the route follows the course state.
    queueMicrotask(() => setPendingCourse(null));
  }, [pendingCourse]);

  // The history follows the app: the route is the screen and the open course.
  const courseId = (course.source ? sourceId(course.source) : null) ?? pendingCourse;
  useEffect(() => {
    appHistory.setRoute({ screen, course: courseId });
  }, [screen, courseId]);
  // Back and Forward change the app's state the same way the navigation does.
  const applyRoute = useRef<(route: Route) => void>(() => {});
  useEffect(() => {
    applyRoute.current = (route) => {
      setLessonId(null);
      setLayoutEditorOpen(false);
      setScreen(route.screen);
      if (route.course === null) course.closeCourse();
      else if ((course.source ? sourceId(course.source) : null) !== route.course)
        openCourseById(route.course);
    };
  });
  useEffect(() => appHistory.onRoute((route) => applyRoute.current(route)), []);

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

  if (layoutEditorOpen) {
    return <LayoutEditorScreen onExit={() => setLayoutEditorOpen(false)} />;
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
            {screen === 'settings' && (
              <SettingsScreen onEditLayout={() => setLayoutEditorOpen(true)} />
            )}
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
                    <LessonSettingsProvider>
                      <Shell />
                    </LessonSettingsProvider>
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
