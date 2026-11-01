import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { LIBRARY_PIECES } from '../core/libraryCatalog.ts';
import {
  addEntry,
  fileEntry,
  libraryEntry,
  markPlayed as applyPlayed,
  migrateFromProgress,
  removeEntry,
  setLessonCount as applyCount,
  type MyLessonEntry,
} from '../core/myLessons.ts';
import { buildScore } from '../core/score.ts';
import { loadScoreBytes, loadScoreFile } from '../playback/loadScoreFile.ts';
import { useProgress } from '../progress/context.ts';
import {
  MyLessonsContext,
  type AddFileResult,
  type FileSourceResult,
  type MyLessonsValue,
  type ReadFileResult,
} from './context.ts';
import { deleteFile, getFile, putFile } from './fileStore.ts';
import { loadMyLessons, saveMyLessons } from './storage.ts';

/** The learner's list of pieces, with the kept copies of the files they added. */
export function MyLessonsProvider({ children }: { children: ReactNode }) {
  const { progress } = useProgress();
  const [initial] = useState<MyLessonEntry[]>(
    () => loadMyLessons() ?? migrateFromProgress(progress.lessons, LIBRARY_PIECES, Date.now()),
  );
  const [entries, setEntries] = useState<readonly MyLessonEntry[]>(initial);
  // Read by every change, so two changes in one tick cannot overwrite each other.
  const entriesRef = useRef<readonly MyLessonEntry[]>(initial);

  // Saves the list once at the start, so the first-start migration runs only once.
  useEffect(() => saveMyLessons(entriesRef.current), []);

  const update = useCallback((change: (list: readonly MyLessonEntry[]) => MyLessonEntry[]) => {
    const next = change(entriesRef.current);
    entriesRef.current = next;
    setEntries(next);
    saveMyLessons(next);
  }, []);

  const has = useCallback((id: string) => entries.some((item) => item.id === id), [entries]);

  const addLibraryPiece = useCallback<MyLessonsValue['addLibraryPiece']>(
    (piece) => update((list) => addEntry(list, libraryEntry(piece, Date.now())).entries),
    [update],
  );

  const addFile = useCallback(
    async (file: File): Promise<AddFileResult> => {
      const result = await loadScoreFile(file);
      if (!result.ok) return { ok: false, error: result.error };
      if (entriesRef.current.some((item) => item.id === result.id)) {
        return { ok: true, alreadyThere: true };
      }
      const stored = await putFile(result.id, { name: file.name, bytes: await file.arrayBuffer() });
      if (!stored.ok) return { ok: false, error: 'storage' };
      update((list) => addEntry(list, fileEntry(result.id, file.name, Date.now())).entries);
      return { ok: true, alreadyThere: false };
    },
    [update],
  );

  const remove = useCallback(
    async (id: string) => {
      const entry = entriesRef.current.find((item) => item.id === id);
      update((list) => removeEntry(list, id));
      if (entry?.source === 'file') await deleteFile(id);
    },
    [update],
  );

  const markPlayed = useCallback(
    (id: string) => update((list) => applyPlayed(list, id, Date.now())),
    [update],
  );

  const setLessonCount = useCallback(
    (id: string, count: number) => {
      const entry = entriesRef.current.find((item) => item.id === id);
      if (entry && entry.lessonCount !== count) update((list) => applyCount(list, id, count));
    },
    [update],
  );

  const readFile = useCallback(async (id: string): Promise<ReadFileResult> => {
    const stored = await getFile(id);
    if (!stored.ok) return { ok: false, error: 'missingFile' };
    return { ok: true, file: new File([stored.value.bytes], stored.value.name) };
  }, []);

  const loadFileSource = useCallback(async (id: string): Promise<FileSourceResult> => {
    const stored = await getFile(id);
    if (!stored.ok) return { ok: false, error: 'missingFile' };
    const result = await loadScoreBytes(new Uint8Array(stored.value.bytes));
    if (!result.ok) return { ok: false, error: result.error };
    return {
      ok: true,
      id,
      title: stored.value.name.replace(/\.[^.]*$/, ''),
      score: buildScore(result.piece),
    };
  }, []);

  const value = useMemo<MyLessonsValue>(
    () => ({
      entries,
      has,
      addLibraryPiece,
      addFile,
      remove,
      markPlayed,
      setLessonCount,
      readFile,
      loadFileSource,
    }),
    [
      entries,
      has,
      addLibraryPiece,
      addFile,
      remove,
      markPlayed,
      setLessonCount,
      readFile,
      loadFileSource,
    ],
  );
  return <MyLessonsContext.Provider value={value}>{children}</MyLessonsContext.Provider>;
}
