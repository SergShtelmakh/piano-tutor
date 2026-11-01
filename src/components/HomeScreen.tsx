import { useT } from '../i18n/context.ts';
import { useProgress } from '../progress/context.ts';
import ContinueCard from './ContinueCard.tsx';
import HomeTiles from './HomeTiles.tsx';
import InstallCard from './InstallCard.tsx';
import Logo from './Logo.tsx';
import type { MyLessonEntry } from '../core/myLessons.ts';
import type { Screen } from './shell/screens.ts';
import StatsBar from './StatsBar.tsx';
import { notice } from './ui.ts';

export default function HomeScreen({
  onStart,
  onContinuePiece,
  onNavigate,
}: {
  onStart: (lessonId: string) => void;
  onContinuePiece: (entry: MyLessonEntry, lastLessonId: string) => void;
  onNavigate: (screen: Screen) => void;
}) {
  const t = useT();
  const { storageAvailable } = useProgress();

  return (
    <div className="flex w-full flex-col gap-5 py-6 text-left wide:max-w-3xl wide:py-10 short:max-w-none short:flex-row short:gap-5 short:py-4">
      <div className="flex flex-col gap-4 short:w-72 short:shrink-0">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 wide:hidden">
            <Logo />
            <span className="text-xl font-extrabold tracking-tight">{t('appName')}</span>
          </div>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight short:text-2xl wide:text-4xl">
            {t('homeHeading')}
          </h1>
        </div>
        <ContinueCard onStart={onStart} onContinuePiece={onContinuePiece} />
        <div className="short:hidden">
          <StatsBar />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <InstallCard />
        {!storageAvailable && (
          <p role="status" className={notice}>
            {t('progressNotSaved')}
          </p>
        )}
        <HomeTiles onNavigate={onNavigate} />
      </div>
    </div>
  );
}
