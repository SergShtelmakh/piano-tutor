import { usePwaUpdate } from '../pwa/usePwaUpdate.ts';
import OfflineReadyNote from './OfflineReadyNote.tsx';
import UpdateBanner from './UpdateBanner.tsx';

/** Fixed bottom bars: "works offline" (once) and "new version" (not while a lesson is open). */
export default function PwaNotices({ lessonOpen }: { lessonOpen: boolean }) {
  const { offlineReady, needRefresh, reload, dismissOfflineReady, dismissUpdate } = usePwaUpdate();
  const showUpdate = needRefresh && !lessonOpen;
  if (!offlineReady && !showUpdate) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-3xl flex-col gap-2 px-4 pb-3">
      {showUpdate && <UpdateBanner onReload={reload} onLater={dismissUpdate} />}
      {offlineReady && <OfflineReadyNote onClose={dismissOfflineReady} />}
    </div>
  );
}
