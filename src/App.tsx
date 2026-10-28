import { useState } from 'react';
import BuildInfo from './components/BuildInfo.tsx';
import CourseScreen from './components/CourseScreen.tsx';
import HomeScreen from './components/HomeScreen.tsx';
import LanguageSelector from './components/LanguageSelector.tsx';
import LessonScreen from './components/LessonScreen.tsx';
import MidiStatus from './components/MidiStatus.tsx';
import ModeSwitch, { type Mode } from './components/ModeSwitch.tsx';
import PwaNotices from './components/PwaNotices.tsx';
import OctaveControl from './components/OctaveControl.tsx';
import PianoKeyboard from './components/PianoKeyboard.tsx';
import PlayerScreen from './components/PlayerScreen.tsx';
import VolumeControl from './components/VolumeControl.tsx';
import { LESSON_CATALOG } from './core/lessons.ts';
import { CourseProvider } from './course/CourseProvider.tsx';
import { useCourse } from './course/context.ts';
import { useT } from './i18n/context.ts';
import { NoteInputProvider } from './input/NoteInputProvider.tsx';
import { LibraryMarksProvider } from './library/LibraryMarksProvider.tsx';
import { PlayerProvider } from './playback/PlayerProvider.tsx';
import { ProgressProvider } from './progress/ProgressProvider.tsx';

/** The screens. It sits inside the providers, so it can use the course state. */
function Shell() {
  const t = useT();
  const course = useCourse();
  const [mode, setMode] = useState<Mode>('home');
  // The id of the open lesson; while set, it replaces every other screen.
  const [lessonId, setLessonId] = useState<string | null>(null);
  const catalogEntry = LESSON_CATALOG.find((item) => item.id === lessonId);
  const courseEntry = lessonId ? course.lessonById(lessonId) : undefined;
  const entry = catalogEntry ?? courseEntry;
  // The course screen replaces Home / Free play / Player while a piece's course is open.
  const courseOpen = course.piece !== null;

  const changeMode = (next: Mode) => {
    setLessonId(null);
    course.closeCourse();
    setMode(next);
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-slate-50 text-slate-900">
      <header className="flex justify-end px-4 py-3">
        <LanguageSelector />
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-5 px-4 pb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight">{t('appName')}</h1>
        <p className="text-lg text-slate-700">{t('tagline')}</p>
        <ModeSwitch mode={entry || courseOpen ? null : mode} onChange={changeMode} />
        {!entry && !courseOpen && mode === 'free' && (
          <p className="rounded-lg bg-white px-4 py-3 text-slate-600 shadow-sm">{t('playHint')}</p>
        )}
        <MidiStatus />
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          <VolumeControl />
          {!entry && !courseOpen && mode === 'free' && <OctaveControl />}
        </div>
        {entry ? (
          <LessonScreen
            key={entry.id}
            entry={entry}
            // A lesson of a course goes back to the course; the others go back to Home.
            onExit={courseEntry ? () => setLessonId(null) : () => changeMode('home')}
            backKey={courseEntry ? 'lessonBackToCourse' : 'lessonBack'}
          />
        ) : courseOpen ? (
          <CourseScreen onStart={setLessonId} onOpenInPlayer={() => changeMode('player')} />
        ) : mode === 'free' ? (
          <PianoKeyboard />
        ) : mode === 'player' ? (
          <PlayerScreen />
        ) : (
          <HomeScreen onStart={setLessonId} />
        )}
      </main>
      <BuildInfo />
      <PwaNotices lessonOpen={entry !== undefined} />
    </div>
  );
}

export default function App() {
  return (
    <ProgressProvider>
      <NoteInputProvider>
        <LibraryMarksProvider>
          <PlayerProvider>
            <CourseProvider>
              <Shell />
            </CourseProvider>
          </PlayerProvider>
        </LibraryMarksProvider>
      </NoteInputProvider>
    </ProgressProvider>
  );
}
