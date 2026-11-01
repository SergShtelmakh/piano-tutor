# Plan — My lessons

> Roadmap phase: Phase 19 — My lessons
> Branch: `feature/my-lessons`
> Status: Draft

## Goal

The learner keeps one list of the pieces they are learning, from the library or from a file on their device (kept there, so it reopens offline), with each piece's progress; the library can be searched; and Home's Continue picks up the last thing they played.

## Approach

- **Pure core** — new `src/core/myLessons.ts`:
  - `MyLessonEntry = { kind: 'library'; pieceId; addedAt; lastPlayedAt?; lessonCount? } | { kind: 'file'; id: 'file-<hash>'; title; fileName; addedAt; lastPlayedAt?; lessonCount? }`; `MyLessons = { entries }`.
  - `addEntry` (no duplicates; an existing entry moves to the top by refreshing `addedAt` and reports `alreadyThere`), `removeEntry`, `markPlayed(entries, pieceId, at)`, `setLessonCount`, `orderedEntries` (FR-3), `filterBySource`, `entryProgress(entry, records)` → `{ finished, percent | null }` (uses `pieceIdOfLesson`), `parseMyLessons` / `serialiseMyLessons` (versioned JSON, bad entries dropped), `migrateFromProgress(records, pieces)` (FR-11, built on `piecesInProgress`).
  - Times are passed in (ms); no clock access.
- **Progress core** — `src/core/progress.ts`: optional `lastLessonId?: string` on `Progress` (still `version: 1`), `withLastLesson(progress, id)`; `parseProgress` keeps a string `lastLessonId`. `EMPTY_PROGRESS` (reset) has none.
- **Course and Continue rules** — `src/core/course.ts`: `nextCourseLesson(course, records, lastId)` (first unfinished in course order, else `lastId`). New `continueTarget(progress, entries, pieces)` in `src/core/myLessons.ts` returns `{ kind: 'builtin', lessonId } | { kind: 'piece', entry, lastLessonId } | null` (FR-16).
- **Library search** — `src/core/library.ts`: `normaliseSearch` (NFD, strip combining marks, lowercase) and `searchPieces(pieces, composers, query, options, favourites, nameOf, locale)` → flat list by title (FR-14). `browse` is unchanged.
- **Adapters** — new `src/myLessons/`:
  - `storage.ts` (`localStorage` key `piano-tutor.myLessons`, try/catch; `null` when the key is absent so the migration runs once).
  - `fileStore.ts` — a minimal IndexedDB wrapper: database `piano-tutor`, store `files`, key `file-<hash>`, value `{ name, bytes: ArrayBuffer }`; `putFile`, `getFile`, `deleteFile`; every call resolves to a result (`ok` / `unavailable` / `quota` / `missing`), never throws.
  - `context.ts` + `MyLessonsProvider.tsx`: the entries, `addLibraryPiece`, `addFile(file)` (runs `loadScoreFile`, then `putFile`, then adds), `addOpenFile` (the file open in the Player; the Player keeps the `File` it loaded), `remove`, `markPlayed`, `setLessonCount`, `loadFileSource(id)` (bytes → `File` → `loadScoreFile` → `FileCourseSource`).
  - Placed in `App.tsx` above `CourseProvider`; `CourseProvider` reports a built course's lesson count (an `onBuilt` callback prop).
- **Course of a kept file** — `CourseProvider` gets `openStoredFile(id, title)`: status `loading` while `loadFileSource` runs, `error` (new `PlayerError` value `missingFile`) when the copy is gone; `CourseScreen` offers Remove for that error (FR-13).
- **UI** —
  - `LessonsScreen` becomes My lessons: `MyLessonsList` (chips, rows, empty states, Remove confirmation, background lesson counts via `loadCourse` / `loadFileSource` + `buildCourse`, one at a time), the Add lesson button, `AddLessonSheet` (native `<dialog>` with `showModal()` for focus and Escape; bottom-aligned on phones), then the curriculum under "Basics" and Reset progress. `LearningPieces.tsx` is deleted.
  - `LibraryPanel`: search input, flat result list, horizontally scrolling chip row, an `AddToMyLessons` button (+ / ✓) per row. `PlayerScreen`: Add to My lessons next to Learn for an open file.
  - `ContinueCard`: uses `continueTarget`; for a piece it opens the course (library or kept file), waits for `ready`, then starts `nextCourseLesson`. `Shell` (`App.tsx`) calls `withLastLesson` and `markPlayed` when a lesson opens.
  - New icons in `icons.tsx` (plus, check, search, file, trash) as inline stroke SVG.
- **Strings** — `screenLessons` becomes "My lessons"; `homePiecesTitle`, `homePieceFinished`, `homePieceContinue` are removed if nothing else uses them; new keys in `en`, then `uk`, `de`, `fr`.

## Task groups

1. **Pure rules and tests**
   - [ ] `src/core/myLessons.ts` + `myLessons.test.ts`: add / duplicate / remove, markPlayed, setLessonCount, ordering, filter, percent (incl. unknown count → `null`), parse / serialise (bad data → empty, bad entries dropped), migration (only finished library lessons, once).
   - [ ] `progress.ts`: optional `lastLessonId`, `withLastLesson`, parse keeps it (still version 1); tests incl. an old save without the field.
   - [ ] `course.ts`: `nextCourseLesson`; `myLessons.ts`: `continueTarget` (built-in, piece, removed piece, piece no longer in the catalogue, fresh start, all finished); tests.
   - [ ] `library.ts`: `normaliseSearch`, `searchPieces` (title, composer in the locale, accents, case, chips and favourites applied, title order); tests.
2. **Storage and provider**
   - [ ] `src/myLessons/storage.ts`, `fileStore.ts` (IndexedDB wrapper with result values), `context.ts`, `MyLessonsProvider.tsx` (migration on first load, add / remove deleting the kept file, markPlayed, setLessonCount, `loadFileSource`).
   - [ ] Wire into `App.tsx`; `CourseProvider`: `openStoredFile`, `onBuilt` lesson count, `missingFile` error; `PlayerProvider` keeps the open `File` for `addOpenFile`.
   - [ ] `Shell`: record `lastLessonId` and `markPlayed` when a lesson opens; Reset progress clears `lastLessonId` only.
3. **My lessons screen and Add lesson sheet**
   - [ ] `MyLessonsList` (rows, chips, empty states, Remove confirmation, background counts) and `AddLessonSheet` (From file with errors and "already there", From library → Library screen).
   - [ ] `LessonsScreen` layout (list, Add lesson, Basics, Reset progress); delete `LearningPieces`; `CourseScreen` Remove for `missingFile`; icons; strings (`en`, `uk`, `de`, `fr`).
4. **Library: search and add**
   - [ ] `LibraryPanel`: search box, flat result list with composer line, scrolling chip row, + / ✓ per row; `PlayerScreen`: Add to My lessons for an open file; strings.
5. **Continue and wrap-up**
   - [ ] `ContinueCard` with `continueTarget`: built-in, piece (loading state, then the next lesson), fallback; strings.
   - [ ] Update `specs/tech-stack.md` project layout (new `src/core/myLessons.ts`, `src/myLessons/`, IndexedDB under Persistence, `lastLessonId`); run `validation.md`.

## Files touched

| File                                                                                                       | Change                                                       |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `src/core/myLessons.ts`, `src/core/myLessons.test.ts`                                                      | New: list rules, migration, Continue target                  |
| `src/core/progress.ts`, `src/core/progress.test.ts`                                                        | Optional `lastLessonId`, `withLastLesson`                    |
| `src/core/course.ts`, `src/core/course.test.ts`                                                            | `nextCourseLesson`                                           |
| `src/core/library.ts`, `src/core/library.test.ts`                                                          | `normaliseSearch`, `searchPieces`                            |
| `src/myLessons/{storage,fileStore,context}.ts`, `MyLessonsProvider.tsx`                                    | New adapters and provider                                    |
| `src/course/CourseProvider.tsx`, `src/course/context.ts`                                                   | `openStoredFile`, lesson count callback, `missingFile` error |
| `src/playback/PlayerProvider.tsx`, `context.ts`, `errorKeys.ts`                                            | Keep the open `File`; `missingFile` error key                |
| `src/progress/ProgressProvider.tsx`, `context.ts`                                                          | `setLastLesson`                                              |
| `src/App.tsx`                                                                                              | Provider order; record the last played lesson                |
| `src/components/LessonsScreen.tsx`                                                                         | My lessons layout                                            |
| `src/components/MyLessonsList.tsx`, `AddLessonSheet.tsx`, `AddToMyLessons.tsx`                             | New                                                          |
| `src/components/LearningPieces.tsx`                                                                        | Deleted                                                      |
| `src/components/LibraryPanel.tsx`, `PlayerScreen.tsx`, `CourseScreen.tsx`, `ContinueCard.tsx`, `icons.tsx` | Search, add buttons, Remove on error, Continue, icons        |
| `src/i18n/locales/{en,uk,de,fr}.ts`                                                                        | New and renamed strings                                      |
| `specs/tech-stack.md`                                                                                      | Persistence row and project layout                           |

## New dependencies

None. IndexedDB is used through a small wrapper (`fileStore.ts`, about 60 lines); a library such as `idb` is not needed for three operations on one store.

## Risks & open questions

- **Storage eviction:** without `navigator.storage.persist()` the browser may clear IndexedDB under storage pressure (the list would then show a missing file; FR-13 handles it). Asking for persistence is in the Backlog.
- **Background lesson counts** fetch and build courses for rows without a count; done one at a time and only once per entry, so a long list costs a few seconds of work after the first visit.
- **Continue for a piece** is asynchronous (fetch or IndexedDB, then building the course); the card must ignore a second press while loading and a result that arrives after the learner navigated away.
- Two tabs: My lessons, like progress, is last-save-wins.
- The `<dialog>` element's backdrop and top-layer behaviour is verified only manually (no DOM tests).
