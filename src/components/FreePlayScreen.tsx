import { useT } from '../i18n/context.ts';
import MuteButton from './MuteButton.tsx';
import OctaveControl from './OctaveControl.tsx';
import PianoKeyboard from './PianoKeyboard.tsx';
import { notice } from './ui.ts';

export default function FreePlayScreen() {
  const t = useT();

  return (
    <div className="flex w-full flex-col gap-5">
      <p className={`${notice} text-left`}>{t('playHint')}</p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <OctaveControl />
        <MuteButton />
      </div>
      <PianoKeyboard />
    </div>
  );
}
