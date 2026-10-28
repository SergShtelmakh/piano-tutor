// Builds the course of every library piece from its real file, so a piece whose notation breaks
// the course rules is found here. It lives in `config/` because it reads the disk.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildCourse, courseLessons } from '../src/core/course.ts';
import { pieceFile } from '../src/core/library.ts';
import { LIBRARY_PIECES } from '../src/core/libraryCatalog.ts';
import { buildScore } from '../src/core/score.ts';
import { parseMidiFile } from '../src/core/smf.ts';

const ROOT = new URL('../public/library/', import.meta.url).pathname.replace(
  /^\/([A-Za-z]:)/,
  '$1',
);

/** A small seeded random source. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

describe('the course of every library piece', () => {
  for (const piece of LIBRARY_PIECES) {
    it(`${piece.id} builds a course whose lessons match their notation`, () => {
      const result = parseMidiFile(new Uint8Array(readFileSync(join(ROOT, pieceFile(piece)))));
      if (!result.ok) throw new Error(result.error);
      const course = buildCourse(buildScore(result.piece), piece);

      expect(course.stages.length, 'stages').toBeGreaterThanOrEqual(1);
      const lessons = courseLessons(course);
      expect(lessons.length, 'lessons').toBeGreaterThanOrEqual(2);
      expect(lessons.length, 'lessons').toBeLessThanOrEqual(37);
      expect(new Set(lessons.map((lesson) => lesson.id)).size).toBe(lessons.length);

      for (const entry of lessons) {
        const lesson = entry.create(seeded(11));
        const { score, stepTimes } = lesson.notation!;
        expect(lesson.steps.length, entry.id).toBeGreaterThan(0);
        expect(lesson.steps.length, entry.id).toBe(entry.stepCount);
        expect(stepTimes, entry.id).toHaveLength(lesson.steps.length);

        // Every step's notes are drawn in a column at that step's time.
        const columns = score.bars.flatMap((bar) => [...bar.columns.treble, ...bar.columns.bass]);
        lesson.steps.forEach((step, i) => {
          const drawn = columns
            .filter((column) => !column.rest && column.time === stepTimes[i])
            .flatMap((column) => column.notes.map((note) => note.note));
          for (const note of step) expect(drawn, `${entry.id} step ${i}`).toContain(note);
        });
      }
    });
  }
});
