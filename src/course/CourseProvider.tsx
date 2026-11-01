import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { buildCourse, courseLessons, type Course } from '../core/course.ts';
import type { LibraryPiece } from '../core/libraryCatalog.ts';
import { useMyLessons } from '../myLessons/context.ts';
import type { PlayerError } from '../playback/context.ts';
import {
  CourseContext,
  type CourseSource,
  type CourseStatus,
  type CourseValue,
  type FileCourseSource,
  type StoredCourseSource,
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
  const { loadFileSource, setLessonCount } = useMyLessons();
  const [source, setSource] = useState<CourseSource | null>(null);
  const [loaded, setLoaded] = useState<Loaded>({ status: 'loading', course: null, error: null });
  const cache = useRef(new Map<string, Course>());
  const latestRequest = useRef(0);

  const load = useCallback(
    async (target: CourseSource) => {
      const id = idOf(target);
      const ready = (course: Course) => {
        cache.current.set(id, course);
        setLessonCount(id, courseLessons(course).length);
        setLoaded({ status: 'ready', course, error: null });
      };
      const cached = cache.current.get(id);
      if (cached) {
        ready(cached);
        return;
      }
      if (target.kind === 'file') {
        // The score is already in memory: nothing to fetch.
        ready(buildCourse(target.score, { id: target.id, title: target.title }));
        return;
      }
      const request = ++latestRequest.current;
      setLoaded({ status: 'loading', course: null, error: null });
      if (target.kind === 'stored') {
        const result = await loadFileSource(target.id);
        if (request !== latestRequest.current) return;
        if (result.ok) ready(buildCourse(result.score, { id: result.id, title: result.title }));
        else setLoaded({ status: 'error', course: null, error: result.error });
        return;
      }
      const result = await loadCourse(target.piece);
      if (request !== latestRequest.current) return; // another piece was opened, or the screen closed
      if (result.ok) ready(result.course);
      else setLoaded({ status: 'error', course: null, error: result.error });
    },
    [loadFileSource, setLessonCount],
  );

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
  const openStoredFile = useCallback(
    (file: Omit<StoredCourseSource, 'kind'>) => open({ kind: 'stored', ...file }),
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
      openStoredFile,
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
      openStoredFile,
      closeCourse,
      retry,
      lessonById,
    ],
  );
  return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>;
}
