import { buildCourse, courseLessons } from '../core/course.ts';
import { LIBRARY_PIECES } from '../core/libraryCatalog.ts';
import type { MyLessonEntry } from '../core/myLessons.ts';
import { loadCourse } from '../course/loadCourse.ts';
import type { FileSourceResult } from './context.ts';

/**
 * The number of lessons in an entry's course, built without opening the course screen; null when
 * the piece or file can't be read now (the count is then tried again on a later visit).
 */
export async function countLessons(
  entry: MyLessonEntry,
  loadFileSource: (id: string) => Promise<FileSourceResult>,
): Promise<number | null> {
  if (entry.source === 'library') {
    const piece = LIBRARY_PIECES.find((item) => item.id === entry.id);
    if (!piece) return null;
    const result = await loadCourse(piece);
    return result.ok ? courseLessons(result.course).length : null;
  }
  const result = await loadFileSource(entry.id);
  if (!result.ok) return null;
  return courseLessons(buildCourse(result.score, { id: result.id, title: result.title })).length;
}
