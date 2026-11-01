import { useState } from 'react';
import { useT } from '../i18n/context.ts';
import type { MessageKey } from '../i18n/locales/en.ts';
import { useMyLessons } from '../myLessons/context.ts';
import type { LoadedPiece } from '../playback/context.ts';
import { PLAYER_ERROR_KEYS } from '../playback/errorKeys.ts';
import { CheckIcon, PlusIcon } from './icons.tsx';
import { buttonOutline, buttonSmall } from './ui.ts';

/** Adds the file that is open in the Player to My lessons (a copy is kept on the device). */
export default function AddFileToMyLessons({
  loaded,
}: {
  loaded: Pick<LoadedPiece, 'fileId' | 'file'>;
}) {
  const t = useT();
  const { has, addFile } = useMyLessons();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<MessageKey | null>(null);

  if (loaded.fileId && has(loaded.fileId)) {
    return (
      <span className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-accent">
        <CheckIcon size={20} />
        {t('libraryAdded')}
      </span>
    );
  }
  if (!loaded.file) return null;

  const file = loaded.file;
  const add = async () => {
    setBusy(true);
    setFailure(null);
    const result = await addFile(file);
    setBusy(false);
    if (!result.ok) {
      setFailure(
        result.error === 'storage' ? 'addSheetStorageError' : PLAYER_ERROR_KEYS[result.error],
      );
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={busy}
        className={`${buttonOutline} ${buttonSmall}`}
        onClick={() => void add()}
      >
        <PlusIcon size={18} />
        {t('libraryAdd')}
      </button>
      {failure && (
        <span role="alert" className="w-full rounded-xl bg-wrong-soft px-4 py-3 text-sm text-wrong">
          {t(failure)}
        </span>
      )}
    </>
  );
}
