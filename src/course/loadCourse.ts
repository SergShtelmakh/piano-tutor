import { buildCourse, type Course } from '../core/course.ts';
import type { LibraryPiece } from '../core/libraryCatalog.ts';
import { buildScore } from '../core/score.ts';
import { loadLibraryPiece } from '../library/loadLibraryPiece.ts';
import type { PlayerError } from '../playback/context.ts';

export type LoadCourseResult = { ok: true; course: Course } | { ok: false; error: PlayerError };

/** Fetches a library piece and builds its course. A piece opened before is cached for offline. */
export async function loadCourse(piece: LibraryPiece): Promise<LoadCourseResult> {
  const result = await loadLibraryPiece(piece);
  if (!result.ok) return result;
  return { ok: true, course: buildCourse(buildScore(result.piece), piece) };
}
