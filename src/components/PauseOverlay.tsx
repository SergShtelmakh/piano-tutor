import { useEffect, useRef } from 'react';
import { useT } from '../i18n/context.ts';
import { buttonOutline, buttonPrimary } from './ui.ts';

/**
 * The pause overlay: a modal `<dialog>`, so focus stays inside, Escape resumes, and focus goes
 * back to the Pause button afterwards.
 */
export default function PauseOverlay({
  open,
  onResume,
  onRestart,
  onExit,
  exitLabel,
}: {
  open: boolean;
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
  exitLabel: string;
}) {
  const t = useT();
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    else if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="pause-title"
      // Escape closes a modal dialog: that resumes the lesson.
      onClose={onResume}
      className="m-auto w-[min(92vw,22rem)] rounded-3xl border border-line bg-surface p-0 text-ink backdrop:bg-bg/80"
    >
      <div className="flex flex-col gap-3 p-6 text-center">
        <h2 id="pause-title" className="text-2xl font-extrabold tracking-tight">
          {t('lessonPausedTitle')}
        </h2>
        <button type="button" className={buttonPrimary} onClick={onResume} autoFocus>
          {t('lessonResume')}
        </button>
        <button type="button" className={buttonOutline} onClick={onRestart}>
          {t('lessonRestart')}
        </button>
        <button type="button" className={buttonOutline} onClick={onExit}>
          {exitLabel}
        </button>
      </div>
    </dialog>
  );
}
