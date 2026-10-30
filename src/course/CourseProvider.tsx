import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { buildCourse, courseLessons, type Course } from '../core/course.ts';
import type { LibraryPiece } from '../core/libraryCatalog.ts';
import type { PlayerError } from '../playback/context.ts';
import {
  CourseContext,
  type CourseSource,
  type CourseStatus,
  type CourseValue,
  type FileCourseSource,
} from './context.ts';
import { loadCourse } from './loadCourse.ts';

interface Loaded {
  status: CourseStatus;
  course: Course | null;
  error: PlayerError | null;
}

const idOf = (source: CourseSource) => (source.kind === 'library' ? source.piece.id : source.id);

/** Which course screen is open, and the course once it is built (kept for the session). */
export function CourseProvider({ children }: { children: ReactNode }) {
  const [source, setSource] = useState<CourseSource | null>(null);
  const [loaded, setLoaded] = useState<Loaded>({ status: 'loading', course: null, error: null });
  const cache = useRef(new Map<string, Course>());
  const latestRequest = useRef(0);

  const load = useCallback(async (target: CourseSource) => {
    const cached = cache.current.get(idOf(target));
    if (cached) {
      setLoaded({ status: 'ready', course: cached, error: null });
      return;
    }
    if (target.kind === 'file') {
      // The score is already in memory: nothing to fetch.
      const course = buildCourse(target.score, { id: target.id, title: target.title });
      cache.current.set(target.id, course);
      setLoaded({ status: 'ready', course, error: null });
      return;
    }
    const request = ++latestRequest.current;
    setLoaded({ status: 'loading', course: null, error: null });
    const result = await loadCourse(target.piece);
    if (request !== latestRequest.current) return; // another piece was opened, or the screen closed
    if (result.ok) {
      cache.current.set(target.piece.id, result.course);
      setLoaded({ status: 'ready', course: result.course, error: null });
    } else {
      setLoaded({ status: 'error', course: null, error: result.error });
    }
  }, []);

  const open = useCallback(
    (target: CourseSource) => {
      latestRequest.current++; // a fetch that is still running must not replace this course
      setSource(target);
      void load(target);
    },
    [load],
  );
  const openCourse = useCallback((piece: LibraryPiece) => open({ kind: 'library', piece }), [open]);
  const openFileCourse = useCallback(
    (file: Omit<FileCourseSource, 'kind'>) => open({ kind: 'file', ...file }),
    [open],
  );
  const closeCourse = useCallback(() => {
    latestRequest.current++;
    setSource(null);
  }, []);
  const retry = useCallback(() => {
    if (source) void load(source);
  }, [source, load]);

  const course = source ? loaded.course : null;
  const lessonById = useCallback(
    (id: string) => (course ? courseLessons(course).find((lesson) => lesson.id === id) : undefined),
    [course],
  );

  const value = useMemo<CourseValue>(
    () => ({
      source,
      status: loaded.status,
      course,
      error: loaded.error,
      openCourse,
      openFileCourse,
      closeCourse,
      retry,
      lessonById,
    }),
    [
      source,
      loaded.status,
      loaded.error,
      course,
      openCourse,
      openFileCourse,
      closeCourse,
      retry,
      lessonById,
    ],
  );
  return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>;
}
