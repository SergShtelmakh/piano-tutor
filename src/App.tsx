import { useState } from 'react';
import BuildInfo from './components/BuildInfo.tsx';
import HomeScreen from './components/HomeScreen.tsx';
import LanguageSelector from './components/LanguageSelector.tsx';
import LessonScreen from './components/LessonScreen.tsx';
import MidiStatus from './components/MidiStatus.tsx';
import ModeSwitch, { type Mode } from './components/ModeSwitch.tsx';
import PwaNotices from './components/PwaNotices.tsx';
import OctaveControl from './components/OctaveControl.tsx';
import PianoKeyboard from './components/PianoKeyboard.tsx';
import VolumeControl from './components/VolumeControl.tsx';
import { LESSON_CATALOG } from './core/lessons.ts';
import { useT } from './i18n/context.ts';
import { NoteInputProvider } from './input/NoteInputProvider.tsx';
import { ProgressProvider } from './progress/ProgressProvider.tsx';

export default function App() {
  const t = useT();
  const [mode, setMode] = useState<Mode>('home');
  // The id of the open lesson; while set, it replaces the Home / Free play screens.
  const [lessonId, setLessonId] = useState<string | null>(null);
  const entry = LESSON_CATALOG.find((item) => item.id === lessonId);

  const changeMode = (next: Mode) => {
    setLessonId(null);
    setMode(next);
  };

  return (
    <ProgressProvider>
      <NoteInputProvider>
        <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
          <header className="flex justify-end px-4 py-3">
            <LanguageSelector />
          </header>
          <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-5 px-4 pb-10 text-center">
            <h1 className="text-4xl font-bold tracking-tight">{t('appName')}</h1>
            <p className="text-lg text-slate-700">{t('tagline')}</p>
            <ModeSwitch mode={entry ? null : mode} onChange={changeMode} />
            {!entry && mode === 'free' && (
              <p className="rounded-lg bg-white px-4 py-3 text-slate-600 shadow-sm">
                {t('playHint')}
              </p>
            )}
            <MidiStatus />
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              <VolumeControl />
              {!entry && mode === 'free' && <OctaveControl />}
            </div>
            {entry ? (
              <LessonScreen entry={entry} onExit={() => changeMode('home')} />
            ) : mode === 'free' ? (
              <PianoKeyboard />
            ) : (
              <HomeScreen onStart={setLessonId} />
            )}
          </main>
          <BuildInfo />
          <PwaNotices lessonOpen={entry !== undefined} />
        </div>
      </NoteInputProvider>
    </ProgressProvider>
  );
}
