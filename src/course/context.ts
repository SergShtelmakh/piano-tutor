import { createContext, useContext } from 'react';
import type { Course } from '../core/course.ts';
import type { LessonEntry } from '../core/lessons.ts';
import type { LibraryPiece } from '../core/libraryCatalog.ts';
import type { PlayerError } from '../playback/context.ts';

export type CourseStatus = 'loading' | 'ready' | 'error';

export interface CourseValue {
  /** The piece whose course screen is open, or null. */
  piece: LibraryPiece | null;
  status: CourseStatus;
  /** The course of the open piece, once it is ready. */
  course: Course | null;
  error: PlayerError | null;
  openCourse: (piece: LibraryPiece) => void;
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
