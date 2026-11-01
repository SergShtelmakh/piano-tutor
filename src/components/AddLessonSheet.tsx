import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useT } from '../i18n/context.ts';
import type { MessageKey } from '../i18n/locales/en.ts';
import { useMyLessons } from '../myLessons/context.ts';
import { PLAYER_ERROR_KEYS } from '../playback/errorKeys.ts';
import { SCORE_FILE_ACCEPT } from '../playback/loadScoreFile.ts';
import { ChevronRightIcon, CloseIcon, FileIcon, LibraryIcon } from './icons.tsx';
import { buttonIcon } from './ui.ts';

const option =
  'flex min-h-24 w-full items-center gap-4 rounded-3xl border-[1.5px] bg-bg px-4 py-3 text-left disabled:opacity-40';

function Option({
  icon,
  title,
  subtitle,
  accent = false,
  disabled = false,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  accent?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`${option} ${accent ? 'border-accent' : 'border-line-strong'}`}
    >
      <span
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
          accent ? 'bg-accent text-accent-ink' : 'bg-surface-raised text-warm'
        }`}
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-lg font-extrabold">{title}</span>
        <span className="text-sm text-ink-muted">{subtitle}</span>
      </span>
      <ChevronRightIcon size={22} className={accent ? 'text-accent' : 'text-ink-muted'} />
    </button>
  );
}

/**
 * The Add lesson sheet: a modal `<dialog>` (focus stays inside, Escape closes it, and focus goes
 * back to the button that opened it). A bottom sheet on a phone, a dialog from 768 px.
 */
export default function AddLessonSheet({
  open,
  onClose,
  onChooseLibrary,
}: {
  open: boolean;
  onClose: () => void;
  /** Called when the learner picks From library; the sheet is closed first. */
  onChooseLibrary: () => void;
}) {
  const t = useT();
  const { addFile } = useMyLessons();
  const dialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<MessageKey | null>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      setMessage(null);
      element.showModal();
    } else if (!open && element.open) {
      element.close();
    }
  }, [open]);

  const choose = async (file: File) => {
    setBusy(true);
    setMessage(null);
    const result = await addFile(file);
    setBusy(false);
    if (!result.ok) {
      setMessage(
        result.error === 'storage' ? 'addSheetStorageError' : PLAYER_ERROR_KEYS[result.error],
      );
    } else if (result.alreadyThere) {
      setMessage('addSheetAlready');
    } else {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialog}
      aria-labelledby="add-lesson-title"
      // Escape fires `cancel` then `close`; closing from the backdrop is a click on the dialog itself.
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialog.current) onClose();
      }}
      className="m-0 mt-auto w-full max-w-none rounded-t-3xl border border-line bg-surface p-0 text-ink backdrop:bg-bg/80 wide:m-auto wide:max-w-md wide:rounded-3xl"
    >
      <div className="flex flex-col gap-4 px-6 pb-8 pt-5 text-left">
        <div className="flex items-center justify-between">
          <h2 id="add-lesson-title" className="text-2xl font-extrabold tracking-tight">
            {t('addSheetTitle')}
          </h2>
          <button
            type="button"
            className={buttonIcon}
            aria-label={t('addSheetClose')}
            onClick={onClose}
          >
            <CloseIcon size={22} />
          </button>
        </div>
        <Option
          icon={<FileIcon size={30} />}
          title={t('addSheetFile')}
          subtitle={t('addSheetFileSub')}
          disabled={busy}
          onClick={() => fileInput.current?.click()}
        />
        <Option
          icon={<LibraryIcon size={30} />}
          title={t('addSheetLibrary')}
          subtitle={t('addSheetLibrarySub')}
          accent
          disabled={busy}
          onClick={onChooseLibrary}
        />
        <input
          ref={fileInput}
          type="file"
          accept={SCORE_FILE_ACCEPT}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = ''; // so choosing the same file again still counts
            if (file) void choose(file);
          }}
        />
        {busy && (
          <p role="status" className="text-sm text-ink-muted">
            {t('addSheetAdding')}
          </p>
        )}
        {message && (
          <p role="alert" className="rounded-xl bg-wrong-soft px-4 py-3 text-sm text-wrong">
            {t(message)}
          </p>
        )}
      </div>
    </dialog>
  );
}
