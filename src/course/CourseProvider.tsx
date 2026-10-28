import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { courseLessons, type Course } from '../core/course.ts';
import type { LibraryPiece } from '../core/libraryCatalog.ts';
import type { PlayerError } from '../playback/context.ts';
import { CourseContext, type CourseStatus, type CourseValue } from './context.ts';
import { loadCourse } from './loadCourse.ts';

interface Loaded {
  status: CourseStatus;
  course: Course | null;
  error: PlayerError | null;
}

/** Which piece's course is open, and the course once it is built (kept for the session). */
export function CourseProvider({ children }: { children: ReactNode }) {
  const [piece, setPiece] = useState<LibraryPiece | null>(null);
  const [loaded, setLoaded] = useState<Loaded>({ status: 'loading', course: null, error: null });
  const cache = useRef(new Map<string, Course>());
  const latestRequest = useRef(0);

  const load = useCallback(async (target: LibraryPiece) => {
    const cached = cache.current.get(target.id);
    if (cached) {
      setLoaded({ status: 'ready', course: cached, error: null });
      return;
    }
    const request = ++latestRequest.current;
    setLoaded({ status: 'loading', course: null, error: null });
    const result = await loadCourse(target);
    if (request !== latestRequest.current) return; // another piece was opened, or the screen closed
    if (result.ok) {
      cache.current.set(target.id, result.course);
      setLoaded({ status: 'ready', course: result.course, error: null });
    } else {
      setLoaded({ status: 'error', course: null, error: result.error });
    }
  }, []);

  const openCourse = useCallback(
    (target: LibraryPiece) => {
      setPiece(target);
      void load(target);
    },
    [load],
  );
  const closeCourse = useCallback(() => {
    latestRequest.current++;
    setPiece(null);
  }, []);
  const retry = useCallback(() => {
    if (piece) void load(piece);
  }, [piece, load]);

  const course = piece ? loaded.course : null;
  const lessonById = useCallback(
    (id: string) => (course ? courseLessons(course).find((lesson) => lesson.id === id) : undefined),
    [course],
  );

  const value = useMemo<CourseValue>(
    () => ({
      piece,
      status: loaded.status,
      course,
      error: loaded.error,
      openCourse,
      closeCourse,
      retry,
      lessonById,
    }),
    [piece, loaded.status, loaded.error, course, openCourse, closeCourse, retry, lessonById],
  );
  return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>;
}
