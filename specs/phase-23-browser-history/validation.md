# Validation — Browser Back and history

The feature is done (and the branch can be merged) only when every box is checked.

## Automated

- [x] `bun run lint` passes
- [x] `bun run format:check` passes
- [x] `bun run build` passes
- [x] `bun run test` passes: the new `src/core/route.test.ts` and `src/navigation/history.test.ts`

## Manual checks

Run `bun run build && bun run preview` and open http://localhost:4173 in Chrome in a **new tab**, so no older entries are in its history. Repeat the FR-2 and FR-5 checks once with `BASE_PATH=/piano-tutor/` (http://localhost:4173/piano-tutor/). "Back" means the browser's Back button, or Alt+← on desktop.

- [ ] FR-1: Open My lessons, Library, Free play, and Settings in turn. The address bar shows `#/lessons`, `#/library`, `#/free`, `#/settings`. Home shows `#/` or no hash. Open a library piece's course from Library: the hash is `#/library/course/<id>`. Open a course from My lessons: `#/lessons/course/<id>`. The path before `#` never changes.
- [ ] FR-2: From Home open Library, then Settings, then Free play in the navigation. One Back goes to Home, and the next Back leaves the app (the tab's previous page or a blank tab). Open My lessons → a course → a lesson. Back goes to the course, Back goes to My lessons, Back goes to Home. Open Settings → Edit layout. Back goes to Settings. At 390 × 844, use the in-app Back button on each of these screens instead, then press the browser's Back once: it follows the same tree, with no extra or missing step.
- [ ] FR-3: Start a lesson and play two notes. Back: the pause dialog opens and the lesson is still on screen. Back again: the lesson closes and you are where it was opened from. Start again, pause with the Pause button, then Back: the lesson closes. Start again, open the pause dialog with Back, press Escape: the lesson resumes. Finish a lesson. Back on the summary closes it at once.
- [ ] FR-4: On My lessons open Add lesson. Back closes the sheet and you stay on My lessons. Open it again and close it with its own button. One Back now goes to Home.
- [ ] FR-5: Open a library piece's course and reload: the same course opens. Back goes to the screen below it, then Home. Add a file from disk to My lessons, open its course, and reload: it opens. Open a file from disk in the Library without adding it, press Learn, and reload: Library opens and the hash is `#/library`. Paste `#/nothing` into the address bar and press Enter: Home opens and the hash is corrected. Reload while a lesson is open: its course (or My lessons / Home) opens, and no run starts. Reload in the layout editor: Settings opens. In a new tab open `…/#/library` directly. Back goes to Home, not out of the app.
- [ ] FR-6: Open Library, Back to Home, Forward: Library opens again. Open a course, Back, Forward: the course opens. Open a lesson, Back twice (pause, exit), Forward: the lesson does **not** reopen.
- [ ] FR-7: In Library play a piece and press Back: the sound stops and Home opens. In a lesson, start Listen and the metronome, then Back twice: everything stops and no key is left sounding. The unfinished run is not in the progress (no stars, no XP). Reload: progress, My lessons, and settings are as before.
- [ ] On a real Android phone (Chrome, Cloudflare preview): repeat FR-2 and FR-3 with the edge-swipe Back gesture. Then install the app and repeat. Back on Home closes the app.
- [ ] Offline (DevTools → Network → Offline, or airplane mode on the phone): reload on `#/settings` and on a library course that was opened before. Both open.
- [ ] Works with the computer keyboard (`Q W E R…`) without a MIDI device, and with a MIDI keyboard connected (Back in a lesson pauses it the same way).
- [ ] No console errors
- [ ] No new user-facing strings, or if one was added, it is in all locales (`en`, `uk`, `de`, `fr`) and the user has skimmed it.

## Constitution follow-up

- [ ] `specs/roadmap.md`: phase status updated, and the Phase 18 Backlog line on browser Back / history removed
- [ ] `specs/tech-stack.md`: "Theme and shell" describes the hash routes, the history controller, and the layers (still no router)
- [ ] `CHANGELOG.md` and README (all four) updated
