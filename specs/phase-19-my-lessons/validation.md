# Validation — My lessons

The feature is done (and the branch can be merged) only when every box is checked.

## Automated

- [x] `bun run lint` passes
- [x] `bun run format:check` passes
- [x] `bun run build` passes
- [x] `bun run test` passes — `myLessons.test.ts`, and the new cases in `progress.test.ts`, `course.test.ts`, `library.test.ts`
- [x] `src/core/myLessons.ts` has no React, DOM, storage, IndexedDB, or clock use (read the imports, search for `Date`, `localStorage`, `indexedDB`)

## Manual checks

Run `bun run dev`, open http://localhost:3000 in Chrome. For the offline check use `bun run build && bun run preview` (http://localhost:4173).

- [ ] FR-1: The navigation, the Home tile, and the screen title say **My lessons** (in all four languages). The screen shows chips, the list, Add lesson, then "Basics" with the units, stars, and the Next badge, then Reset progress. "Pieces you are learning" is gone.
- [ ] FR-2: Add a library piece and a `.mid` file. Each row shows the title, `<composer> · From library` / `<file name> · From file`, a bar, and **New**. Finish one course lesson of the library piece: the row shows the right percentage (finished / course lessons) and the bar matches. Pressing a row opens its course.
- [ ] FR-3: Open a lesson of the piece lower in the list, go back: that piece is now first. Add another piece without playing it: it sits above the never-played ones, below the played ones.
- [ ] FR-4: The chips filter by source; All is selected after leaving and returning. With nothing added the empty text with the Add lesson hint shows; with only library pieces, **From file** shows the "nothing here" text.
- [ ] FR-5: Remove a row: a confirmation appears; Cancel keeps it, Remove deletes it. Its stars stay (add it again: the percentage is back). For a file, DevTools → Application → IndexedDB → `piano-tutor` / `files`: the entry is gone.
- [ ] FR-6: In DevTools, delete `lessonCount` from an entry in `piano-tutor.myLessons` (or use a migrated entry), reload, open My lessons: the row first shows "N finished", then a percentage without opening the course.
- [ ] FR-7: Add lesson opens the sheet (bottom sheet at 360 × 800, dialog at 1440 × 900). Close, Escape, and a click outside close it; focus starts in the sheet and returns to Add lesson.
- [ ] FR-8: From file → pick a `.mid`, then an `.mxl`: each is added to the list and the sheet closes. Pick a text file renamed to `.mid`: the Player's error text shows in the sheet, nothing is added. Pick the same `.mid` again: no second row, the "already in My lessons" note shows and the sheet stays open.
- [ ] FR-9: From library closes the sheet and opens the Library screen.
- [ ] FR-10: In the library list, **+** adds a piece and turns into **✓ In My lessons**; the piece appears in My lessons. Open a file in the Library (Open file): **Add to My lessons** next to Learn adds it and then shows "In My lessons".
- [ ] FR-11: Press **Learn** on a piece not in the list and finish a lesson: the piece is **not** added. On a profile from `main` with a finished library course lesson and no `piano-tutor.myLessons` key: after the update, that piece is in My lessons; remove it and reload: it does not come back.
- [ ] FR-12: Add a file, reload the page (and, on `preview`, go offline and reload): open its row, the course opens without choosing the file. A file learnt on `main` (stars present) shows its stars after it is added.
- [ ] FR-13: Delete the file's entry in DevTools → IndexedDB, open its row: the course screen shows an error with Remove, which removes the row. In an Incognito window with site data blocked (or a full quota if it can be simulated), From file shows "Couldn't keep the file on this device" and adds nothing.
- [ ] FR-14: Library search: type `bach` and `BÄCH`-style variants, a part of a title, and (in Українська) a composer's Ukrainian name: matching pieces show as one flat list by title with the composer line; a difficulty chip and ★ Favourites narrow it; clearing the box restores the composer sections; nonsense shows "No pieces match.". At 360 px the chip row scrolls sideways, no page scroll.
- [ ] FR-15 / FR-16: Fresh profile: Continue shows the first built-in lesson. Open a lesson of a piece in My lessons, go Home: Continue shows the piece title and finished / total; press it: the course screen shows "Loading the course…" for a moment (or not at all when it was opened before), then the first unfinished lesson of that course opens. Finish every lesson of a short course (or set records in DevTools): Continue opens the last played lesson. Open a built-in lesson, go Home: Continue is the built-in Next lesson again. Remove the last played piece: Continue falls back to the built-in Next lesson. Repeat with a kept file (offline on `preview`).
- [ ] Reset progress: stars and the last played lesson are reset; My lessons and kept files stay.
- [ ] Accessibility: Tab through My lessons, the sheet, and the library list: focus rings everywhere; the + / ✓ / Remove / search / Close buttons have names (DevTools → Accessibility); touch targets ≥ 44 px.
- [ ] Layouts at 360 × 800, 844 × 390, 1024 × 768, 1440 × 900: no horizontal scroll, the sheet fits.
- [ ] Works with computer keyboard (`A`–`;`, `W E T Y U O P`, `Z` / `X`) without a MIDI device
- [ ] No console errors
- [ ] User-facing text comes from the translations module, with keys in all locales (`en`, `uk`, `de`, `fr`); the user skims the new `uk` / `de` / `fr` strings

## Constitution follow-up

- [ ] `specs/roadmap.md` — phase status updated
- [ ] `specs/tech-stack.md` — Persistence (IndexedDB for kept files), project layout, known debt
- [ ] `CHANGELOG.md` / README (all four languages) updated
