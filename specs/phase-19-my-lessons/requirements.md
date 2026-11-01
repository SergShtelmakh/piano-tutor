# Requirements — My lessons

## Context

Roadmap Phase 19. The user's redesign canvas ([Piano Tutor — оновлений дизайн](https://claude.ai/artifact/8TBSo2UjJ2PTqZ4hoMbcrn), artboards `Lessons`, `AddLesson`, `Library`) shows a "My lessons" list: the pieces the learner works on, from the library or from a file on the device, each with a progress bar and a percentage ("New" before the first lesson), filter chips (All / From file / From library), and an **Add lesson** sheet with _From file_ and _From library_. The library gets a search box and a **+** / **✓ added** per piece.

Today the Lessons screen shows the built-in curriculum plus "Pieces you are learning" (library pieces with a finished course lesson, derived from progress). A file from the device is forgotten when the tab closes; only its stars stay. The Home **Continue** card always opens the next built-in lesson (Phase 18 decision), because progress stores no "last played".

The answers to the clarifying questions are in **Decisions** below.

## Functional requirements

### My lessons list

- **FR-1** The Lessons screen must become **My lessons** (screen title, navigation label, Home tile). From top to bottom it shows: the filter chips, the learner's pieces, the **Add lesson** button, then the built-in curriculum under a **Basics** heading (units, stars, the Next badge, as today), then **Reset progress**. The "Pieces you are learning" section is removed (My lessons replaces it).
- **FR-2** Each row of My lessons must show an icon, the piece's title, a second line (`<composer> · From library` for a library piece, `<file name> · From file` for a file), a progress bar, and the share of the piece's course lessons with a finished run as a percentage, or **New** when none is finished. Pressing the row opens the piece's course screen.
- **FR-3** Rows must be ordered by the last time a lesson of the piece was opened (most recent first); pieces never played follow, newest added first.
- **FR-4** Chips **All**, **From file**, **From library** must filter the rows (All is the default; the choice is not saved). When the list, or the filtered list, is empty, a short text must say so (with a hint to use Add lesson when nothing is added at all).
- **FR-5** Every row must have a **Remove** action that asks for confirmation in the page (Remove / Cancel). Removing takes the piece off the list and, for a file, deletes the copy kept on the device. Stars, XP, and the library marks are kept; adding the piece again shows its stars again.
- **FR-6** The percentage needs the number of lessons in the piece's course. It must be filled in whenever the course is built (opening the course, Continue) and must be computed in the background for rows that don't have it yet when My lessons is shown. Until then the row shows the number of finished lessons instead of a percentage.

### Adding

- **FR-7** **Add lesson** must open a sheet (a bottom sheet on phones, a dialog on wider screens) with **From file** ("Choose a file on your device") and **From library** ("Ready-made pieces by level") and a Close button. Escape and a press outside the sheet close it too; focus moves into the sheet and back to the button when it closes.
- **FR-8** **From file** must open the file picker (`.mid`, `.midi`, `.mxl`, `.musicxml`, `.xml`, as the Player accepts today). A file that loads is kept on the device and added to the top of My lessons; the sheet closes. A file that does not load shows the Player's existing error text in the sheet and adds nothing. A file that is already in the list (same content hash) is not added twice; its row moves to the top and a short note says it was already there.
- **FR-9** **From library** must close the sheet and open the Library screen.
- **FR-10** Each piece in the library list must have a round **+** button ("Add to My lessons") that adds the piece, and shows **✓** ("In My lessons", not a button) for a piece already in the list. When a file from the device is open in the Library (the Player), an **Add to My lessons** button next to Learn must add it the same way (and show "In My lessons" once added).
- **FR-11** Only these explicit actions add a piece: **Learn** and finishing a course lesson must not add it. On the first start after this phase, library pieces with at least one finished course lesson (today's "Pieces you are learning") must be added once, so nothing the learner was working on disappears.

### Files kept on the device

- **FR-12** A file added to My lessons must be kept on the device (IndexedDB) with its name, so its course opens later and offline without choosing the file again. Its stars are the stars of its `file-<hash>` lessons, so a file learnt before this phase gets its stars back when added.
- **FR-13** If the device can't keep the file (storage blocked, quota full), the sheet must say so and add nothing. If a kept file is missing or can't be read when its row is opened, the course screen must show an error with **Remove** offered; the app must not crash.

### Library search

- **FR-14** The library panel must have a search box ("Title or composer") above the chips. The search ignores case and accents and matches the piece's title or the composer's name in the current language. While the box is not empty, the matching pieces show as one flat list ordered by title, each with its composer on the second line; the difficulty chip and ★ Favourites still apply. An empty search shows the composer sections as today. "No pieces match." shows when nothing matches. The chip row scrolls sideways on narrow screens instead of wrapping.

### Continue

- **FR-15** Opening any lesson (built-in or from a course) must remember it as the last played lesson.
- **FR-16** The Home **Continue** card must open the next lesson of what was played last:
  - a built-in lesson: the next built-in lesson without a finished run (today's Next), or the last played one again when all are finished;
  - a course lesson of a piece that is still in My lessons: the first lesson of that course without a finished run, in course order, or the last played lesson again when all are finished. The card shows the piece's title and its finished / total lessons; while the course loads, the card shows a loading state; if it fails, the course screen opens with its error.
  - Nothing played yet, or the last piece was removed (or is no longer in the library): the next built-in lesson, as today. The card is hidden only when that fallback has nothing left either.

## Non-functional requirements

- User-facing text goes through the translations module (English first, then `uk`, `de`, `fr`); the user skims the new strings.
- Works with the on-screen and computer keyboard (no MIDI device required); the sheet, chips, + buttons, and Remove are reachable by Tab, with focus rings and names for icon-only buttons; touch targets ≥ 44 px.
- No new runtime dependencies (IndexedDB is used directly through a small wrapper).
- Pure rules (list operations, ordering, filtering, the percentage, saved-data parsing, the one-time migration, the search match, the next lesson of a course, the Continue target) live in `src/core/` with unit tests; storage and IndexedDB stay in adapters.
- Saved progress keeps `version: 1`: the last played lesson is an optional field, so an older cached build (before its update banner is accepted) still reads the same data. Invalid or missing My lessons data means an empty list (after the migration), never a crash.
- Colours only from theme tokens; layouts work at 360 × 800, 844 × 390, 1024 × 768, and 1440 × 900.
- Privacy: kept files never leave the device.

## Out of scope

- A search box in My lessons (the canvas's search icon) — Backlog.
- Built-in lessons as rows of My lessons, or adding single lessons; a manual order or pinning.
- Keeping courses of files opened before this phase (their bytes were never stored); they come back only when the file is added again.
- Asking for persistent storage (`navigator.storage.persist()`), showing used space, or a size limit for all kept files together.
- Syncing My lessons between two open tabs (the last save wins, as for progress).
- Grouping the 5 difficulty levels into 3 canvas chips; a flat library list without composer sections.
- Drag and drop, `.mscz`, renaming a kept file.

## Decisions

| Question                                 | Decision                                                                                                                                                                                                                         | Reason                                                                                    |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Where does My lessons live?              | The Lessons screen becomes My lessons: the learner's pieces on top, the built-in curriculum below as "Basics". No new navigation item.                                                                                           | User choice. Keeps five screens.                                                          |
| How does a piece get in, and out?        | Only explicitly: **+** in the library, Add lesson, Add to My lessons in the Player. Learn and finishing a lesson don't add. Already-started library pieces are added once on the first start. Remove asks first and keeps stars. | User choice ("explicit add only"); the migration keeps "Pieces you are learning" visible. |
| What is kept for a file from the device? | The file itself, in IndexedDB (each file is already limited to 20 MB by the loader). Removing it from My lessons deletes the copy.                                                                                               | User choice: reopens later and offline without picking the file again.                    |
| What does Continue open?                 | The next unfinished lesson of what was played last (built-in or a piece); the last played lesson again if all are done; the built-in Next lesson on a fresh start or when the piece is gone.                                     | User choice.                                                                              |
| Library list with search                 | Keep the 5 levels and the composer sections; search shows a flat list of matches; + / ✓ on every row.                                                                                                                            | User choice.                                                                              |
| When is a lesson "played"?               | When it is opened (not only when it is finished).                                                                                                                                                                                | Agent default: a lesson left halfway is still what the learner wants to continue. Review. |
| Where is "last played" kept?             | Progress gets an optional `lastLessonId` (still `version: 1`); each My lessons entry has `lastPlayedAt` for the order.                                                                                                           | Agent default: no version bump, so an older cached build can't wipe progress. Review.     |
| Does Reset progress clear My lessons?    | No: it resets stars, XP, the streak, and the last played lesson; the list and kept files stay.                                                                                                                                   | Agent default: the list is what the learner chose to learn, not a score. Review.          |
| How is the percentage computed?          | Finished course lessons / all lessons of the course; the count is stored with the entry when the course is built.                                                                                                                | Agent default: avoids fetching and building every course on each visit. Review.           |
