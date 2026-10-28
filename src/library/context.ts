import { createContext, useContext } from 'react';
import type { LibraryMarks } from '../core/libraryMarks.ts';

export interface LibraryMarksValue {
  marks: LibraryMarks;
  toggleFavourite: (id: string) => void;
  toggleDone: (id: string) => void;
}

export const LibraryMarksContext = createContext<LibraryMarksValue | null>(null);

export function useLibraryMarks(): LibraryMarksValue {
  const value = useContext(LibraryMarksContext);
  if (!value) throw new Error('LibraryMarksProvider is missing');
  return value;
}
