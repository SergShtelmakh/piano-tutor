# Plan — Lesson content

> Roadmap phase: Phase 6 — Lesson content
> Branch: `feature/lesson-content`
> Status: Implemented (replanned; manual validation open)

## Goal

The learner gets a first-week curriculum of 13 lessons in five units: treble notes, bass notes (left hand), both clefs, melodies, and intervals and chords. The staff shows a phrase of notes to read ahead, and Home groups the lessons and suggests the next one.

## Approach

**Core (pure, `src/core/`)**

- `lesson.ts`: chord steps are judged by held keys (FR-12): `LessonState.playedInStep` holds the step's notes pressed and still down, `judge` also handles `noteoff`, and `correct` grows by the step size when a step completes. `Lesson` gets `pages: readonly number[]`, the number of steps on each page (the sum equals `steps.length`). The judge, `startLesson`, and `accuracy` stay as they are. A helper `pageOf(lesson, stepIndex)` returns the page's first step and length.
- `lessons.ts`:
  - Generalise `randomSequence` so it works on any pool by index (`randomIndices(poolSize, length, random)`, no repeat in a row), and use it for notes, intervals, and chords. Keep `randomSequence` (used by tests and the note lessons) on top of it.
  - `evenPages(total, max = 8)` for random lessons (20 → 7, 7, 6).
  - A small factory for each lesson kind: `randomNotesLesson(...)`, `randomChordsLesson(...)` (pools of fixed chords / intervals), `melodyLesson(...)` (fixed phrases → steps + pages). The data for the 13 lessons (pools, triads, tune phrases) is in this file or a sibling `curriculum.ts` if `lessons.ts` gets long.
  - `LESSON_UNITS`: an ordered list of `{ id, titleKey, lessons: LessonEntry[] }`. `LESSON_CATALOG` stays as the flat list derived from it, so `App`'s lookup by id doesn't change.
  - `nextLessonId(catalog, progress.lessons)`: the first id without a record, or `null`.
- `staffRow.ts` (new): the geometry of one page. Input: the page's steps. Output per step: an x slot, and per note `{ note, clef, index, ledger, shifted }` from `staffPosition`. `shifted` is true for the upper note of a second on the same clef. Ledger lines are merged per step (a chord with C4 and A3 needs no duplicate line). The staff width comes from the slot count. Unit-tested.
- `notes.ts` / `computerKeymap.ts`: a helper `keyboardWindow(baseOctave)` returning `{ low, high }` from `KEY_OFFSETS`, so the catalog test (FR-3) doesn't hard-code −1 / 16.

**UI**

- `StaffView`: takes a row (the `staffRow` result) plus a state per step (`played` / `current` / `upcoming`), the notes already played in the current chord, and feedback. It draws the clefs and lines once, then each step's ledger lines and noteheads at its slot. The `viewBox` width grows with the number of slots; the SVG scales to its container (`w-full`).
- `LessonScreen`: computes the shown page from `state.stepIndex` (and, during a `right` flash that finished a step, from the previous step, so the completed page stays for the flash; FR-9). Picks the instruction key from whether the lesson has a step with more than one note (FR-12). Builds the accessible label from all targets (FR-10).
- `useLesson`: exposes what `LessonScreen` needs to know about the step that was just completed (the step index of the last `right` feedback). The judge path doesn't change.
- `HomeScreen`: renders `LESSON_UNITS` with a heading per unit; `LessonCard` gets an `isNext` prop and shows the "Next" badge.

**Translations**: unit headings, 13 lesson titles (the old `lessonNoteReadingTitle` text becomes "Around middle C"), two instructions, the plural target-notes label, the "Next" badge, in `en` first, then `uk`, `de`, `fr`.

## Task groups

1. **Curriculum core**
   - [x] `Lesson.pages` and `pageOf`; update `createNoteReadingLesson` and tests
   - [x] `randomIndices` / `randomSequence`, `evenPages`, factories for random notes, random chords/intervals, and melodies
   - [x] Lesson data: the 13 lessons from FR-1 (pools, interval pairs, triads, tune phrases)
   - [x] `LESSON_UNITS`, derived `LESSON_CATALOG`, `nextLessonId`, `keyboardWindow`
   - [x] Unit tests: every catalog lesson uses white keys only, stays inside its keyboard window, has pages that sum to its steps, max 8 per page (FR-3, FR-4); melodies have the exact notes; random lessons never repeat a step in a row (FR-2); `nextLessonId` (FR-5); ids are unique and include `note-reading`
2. **Staff row geometry**
   - [x] `src/core/staffRow.ts`: slots, per-note positions, second offsets, merged ledger lines, row width
   - [x] Unit tests: a single note, a triad, a second on one clef (shifted), a step across clefs (B3 + D4), ledger lines merged, 8 slots fit the width
3. **Staff and lesson screen**
   - [x] `StaffView` draws a row with played / current / upcoming states, chord notes played so far, and feedback colours (FR-6 – FR-9)
   - [x] `useLesson` / `LessonScreen`: page selection including the flash on the last step of a page, instruction per lesson kind, accessible label for chords (FR-9, FR-10, FR-12)
   - [ ] Check 360 px width with an 8-step phrase and a chord lesson (FR-11)
4. **Home by unit**
   - [x] `HomeScreen` renders units with headings; `LessonCard` shows the "Next" badge (FR-14, FR-15)
5. **Translations and wrap-up**
   - [x] All new keys in `en`, `uk`, `de`, `fr` (FR-16), the renamed title for `note-reading`
   - [x] `README.md`: the lesson list in the feature overview
   - [ ] Run `validation.md`: automated gates, then manual checks; ask the user to skim the new `uk` / `de` / `fr` strings

## Files touched

| File                                                   | Change                                                             |
| ------------------------------------------------------ | ------------------------------------------------------------------ |
| `src/core/lesson.ts`, `lesson.test.ts`                 | `pages`, `pageOf`                                                  |
| `src/core/lessons.ts`, `lessons.test.ts`               | Generators, curriculum data, units, `nextLessonId`, catalog checks |
| `src/core/curriculum.ts` (new, optional)               | Lesson data if `lessons.ts` gets too long                          |
| `src/core/staffRow.ts`, `staffRow.test.ts` (new)       | Row geometry                                                       |
| `src/core/computerKeymap.ts`, `computerKeymap.test.ts` | `keyboardWindow`                                                   |
| `src/components/StaffView.tsx`                         | Row of steps, chords, states                                       |
| `src/components/LessonScreen.tsx`                      | Page selection, instruction, label                                 |
| `src/lesson/useLesson.ts`                              | Last completed step for the page flash                             |
| `src/components/HomeScreen.tsx`, `LessonCard.tsx`      | Units, "Next" badge                                                |
| `src/i18n/locales/{en,uk,de,fr}.ts`                    | New strings                                                        |
| `README.md`, `specs/roadmap.md`                        | Lesson list; phase status                                          |

## New dependencies

None.

## Risks & open questions

- **Size:** this is the biggest phase so far (13 lessons, a new staff layout, chords). The five groups are ordered so that groups 1–2 (pure, tested) can be reviewed before any UI changes. If group 3 grows, chords could move to a follow-up phase without touching groups 1–2.
- **Second offsets** next to ledger lines and across the two staves are the trickiest part of the geometry; the tests in group 2 cover the cases in the lessons. Other cases (clusters of three adjacent notes) don't occur in the content and aren't handled specially.
- **Narrow screens:** 8 whole notes plus clefs on a 360 px phone are small. If they are hard to read, the fallback is a page maximum of 6 on narrow containers, chosen in the UI, which would change FR-4. Decide during validation.
- **Tune accuracy:** melody notes are checked by unit tests against the written sequences; the user should play them once to confirm they sound right.
- **Translated tune titles** (especially Ukrainian) need the user's skim.
