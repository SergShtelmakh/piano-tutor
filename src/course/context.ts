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

/** What a course is built from: a library piece (fetched) or a file the learner opened. */
export type CourseSource = { kind: 'library'; piece: LibraryPiece } | FileCourseSource;

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
