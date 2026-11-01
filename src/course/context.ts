import { createContext, useContext } from 'react';
import type { Course } from '../core/course.ts';
import type { LessonEntry } from '../core/lessons.ts';
import type { LibraryPiece } from '../core/libraryCatalog.ts';
import type { Score } from '../core/score.ts';
import type { PlayerError } from '../playback/context.ts';

export type CourseStatus = 'loading' | 'ready' | 'error';

/** A file from the learner's disk, open in the Player. Its course is built from its score. */
export interface FileCourseSource {
  kind: 'file';
  /** `file-<hash>`: the course id, and so the progress id, of this file. */
  id: string;
  title: string;
  score: Score;
}

/** A file kept in My lessons: its copy is read from the device when the course opens. */
export interface StoredCourseSource {
  kind: 'stored';
  /** `file-<hash>`, as for a file opened from disk. */
  id: string;
  title: string;
}

/** What a course is built from: a library piece (fetched), a file just opened, or a kept file. */
export type CourseSource =
  { kind: 'library'; piece: LibraryPiece } | FileCourseSource | StoredCourseSource;

/** The id of a course source: the piece id, or `file-<hash>`. */
export function sourceId(source: CourseSource): string {
  return source.kind === 'library' ? source.piece.id : source.id;
}

export interface CourseValue {
  /** What the open course screen is for, or null when no course is open. */
  source: CourseSource | null;
  status: CourseStatus;
  /** The course of the open source, once it is ready. */
  course: Course | null;
  error: PlayerError | null;
  openCourse: (piece: LibraryPiece) => void;
  /** Opens the course of a file that is open in the Player. */
  openFileCourse: (file: Omit<FileCourseSource, 'kind'>) => void;
  /** Opens the course of a file kept in My lessons. */
  openStoredFile: (file: Omit<StoredCourseSource, 'kind'>) => void;
  closeCourse: () => void;
  retry: () => void;
  /** A lesson of the open course, shaped like a lesson of the curriculum. */
  lessonById: (id: string) => LessonEntry | undefined;
}

export const CourseContext = createContext<CourseValue | null>(null);

export function useCourse(): CourseValue {
  const value = useContext(CourseContext);
  if (!value) throw new Error('CourseProvider is missing');
  return value;
}
