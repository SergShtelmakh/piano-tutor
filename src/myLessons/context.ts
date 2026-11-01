import { createContext, useContext } from 'react';
import type { MyLessonEntry } from '../core/myLessons.ts';
import type { LibraryPiece } from '../core/libraryCatalog.ts';
import type { Score } from '../core/score.ts';
import type { PlayerError } from '../playback/context.ts';

export type AddFileResult =
  | { ok: true; alreadyThere: boolean }
  /** `storage`: the file is fine, but the device could not keep it. */
  | { ok: false; error: PlayerError | 'storage' };

export type ReadFileResult = { ok: true; file: File } | { ok: false; error: PlayerError };

export type FileSourceResult =
  { ok: true; id: string; title: string; score: Score } | { ok: false; error: PlayerError };

export interface MyLessonsValue {
  /** In the order they were added or played; use `orderedEntries` to show them. */
  entries: readonly MyLessonEntry[];
  has: (id: string) => boolean;
  addLibraryPiece: (piece: Pick<LibraryPiece, 'id'>) => void;
  /** Checks the file, keeps a copy on the device, and adds it. */
  addFile: (file: File) => Promise<AddFileResult>;
  /** Takes the entry off the list and deletes the kept copy of a file. Stars stay. */
  remove: (id: string) => Promise<void>;
  /** Remembers that a lesson of this piece was opened now. */
  markPlayed: (id: string) => void;
  setLessonCount: (id: string, count: number) => void;
  /** The kept copy of a file as a `File`. */
  readFile: (id: string) => Promise<ReadFileResult>;
  /** The kept copy of a file, parsed into a score for its course. */
  loadFileSource: (id: string) => Promise<FileSourceResult>;
}

export const MyLessonsContext = createContext<MyLessonsValue | null>(null);

export function useMyLessons(): MyLessonsValue {
  const value = useContext(MyLessonsContext);
  if (!value) throw new Error('MyLessonsProvider is missing');
  return value;
}
