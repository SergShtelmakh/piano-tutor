import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { toggleDone, toggleFavourite, type LibraryMarks } from '../core/libraryMarks.ts';
import { LibraryMarksContext, type LibraryMarksValue } from './context.ts';
import { loadMarks, saveMarks } from './storage.ts';

/** The learner's favourite and done marks, saved on the device after every change. */
export function LibraryMarksProvider({ children }: { children: ReactNode }) {
  const [marks, setMarks] = useState<LibraryMarks>(loadMarks);

  const change = useCallback((update: (current: LibraryMarks) => LibraryMarks) => {
    setMarks((current) => {
      const next = update(current);
      saveMarks(next); // saving twice with the same data (StrictMode) is harmless
      return next;
    });
  }, []);

  const value = useMemo<LibraryMarksValue>(
    () => ({
      marks,
      toggleFavourite: (id) => change((current) => toggleFavourite(current, id)),
      toggleDone: (id) => change((current) => toggleDone(current, id)),
    }),
    [marks, change],
  );
  return <LibraryMarksContext.Provider value={value}>{children}</LibraryMarksContext.Provider>;
}
