import { useState } from 'react';
import BuildInfo from './components/BuildInfo.tsx';
import LanguageSelector from './components/LanguageSelector.tsx';
import LessonScreen from './components/LessonScreen.tsx';
import MidiStatus from './components/MidiStatus.tsx';
import ModeSwitch, { type Mode } from './components/ModeSwitch.tsx';
import OctaveControl from './components/OctaveControl.tsx';
import PianoKeyboard from './components/PianoKeyboard.tsx';
import VolumeControl from './components/VolumeControl.tsx';
import { useT } from './i18n/context.ts';
import { NoteInputProvider } from './input/NoteInputProvider.tsx';

export default function App() {
  const t = useT();
  const [mode, setMode] = useState<Mode>('free');

  return (
    <NoteInputProvider>
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <header className="flex justify-end px-4 py-3">
          <LanguageSelector />
        </header>
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-5 px-4 pb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight">{t('appName')}</h1>
          <p className="text-lg text-slate-700">{t('tagline')}</p>
          <ModeSwitch mode={mode} onChange={setMode} />
          {mode === 'free' && (
            <p className="rounded-lg bg-white px-4 py-3 text-slate-600 shadow-sm">
              {t('playHint')}
            </p>
          )}
          <MidiStatus />
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <VolumeControl />
            {mode === 'free' && <OctaveControl />}
          </div>
          {mode === 'free' ? <PianoKeyboard /> : <LessonScreen onExit={() => setMode('free')} />}
        </main>
        <BuildInfo />
      </div>
    </NoteInputProvider>
  );
}
