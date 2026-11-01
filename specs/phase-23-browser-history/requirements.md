# Requirements — Browser Back and history

## Context

The screen is plain React state in `App.tsx` (`screen`, the open course, the open lesson, the layout editor). Nothing goes into the browser history, so the phone's Back gesture, the browser's Back button, and Android's Back in the installed app all leave Piano Tutor, often in the middle of a lesson. A reload always opens Home. The Backlog has carried this item since Phase 18 ("browser Back / history for the screens").

This is roadmap Phase 23. It changes navigation only. The screens, their content, and what the in-app Back buttons lead to stay as they are.

Decisions made while planning (see the table at the end):

- The URL carries the screen as a **hash route** (`#/library`), so a reload stays on that screen.
- Back follows an **app-like tree**: Home is the root, each main screen is one level below it, and a course, a lesson, and the layout editor each add one level.
- Back in a running lesson **pauses first**. A second Back exits.
- Back **closes open dialogs** before it leaves the screen.
- A reload **restores a course**, but not a lesson or the layout editor.

## Functional requirements

- **FR-1** Each main screen must have its own hash: Home `#/` (and no hash at all), My lessons `#/lessons`, Library `#/library`, Free play `#/free`, Settings `#/settings`. An open course adds `/course/<id>` to the hash of the screen below it (for example `#/library/course/<pieceId>`, or `#/course/<pieceId>` above Home). The hash changes whenever the screen or the course changes. The page path and the base path (`/piano-tutor/` on GitHub Pages) do not change.
- **FR-2** Back must follow the tree:
  - Back from a main screen goes to Home. Back on Home leaves the app, as Back does today.
  - Choosing another main screen in the navigation (rail, sidebar, Home tiles) **replaces** the current level instead of adding one. After Library → Settings → Free play, a single Back goes to Home.
  - Back from a course goes to the screen it was opened from. Back from a lesson goes to where the lesson was opened from (the course, My lessons, or Home), like the lesson's own Back button today. Back from the layout editor goes to Settings.
  - The in-app Back buttons (the header Back on phones, the course's Back, the lesson's and the editor's Back) lead to the same place as the browser's Back. Afterwards the history is the same as if the browser's Back had been used, so the next Back still follows the tree.
- **FR-3** While a lesson run is in progress (not finished, not paused), Back must pause it and open the existing pause dialog (Resume / Restart / Exit). The learner stays in the lesson. Back while the pause dialog is open exits the lesson, whether the dialog was opened by Back, the Pause button, Space, or the page being hidden. Back on the finished-lesson summary exits at once.
- **FR-4** Back with the **Add lesson** sheet open must close the sheet and stay on My lessons. When the sheet is closed in any other way (its close button, Escape, choosing a source), one Back still goes from My lessons to Home: no extra step is left behind.
- **FR-5** Opening the app with a hash (a reload, a bookmark, a link) must open that place:
  - A main-screen hash opens that screen.
  - A course hash opens the course if its id is a library piece or a file kept in My lessons. Any other id (a file opened from disk but not kept, a removed file, an unknown piece) opens the screen below it instead, and the hash is corrected to that screen.
  - An unknown or malformed hash opens Home, and the hash is corrected.
  - A reload while a lesson or the layout editor is open opens the place below it (the course, the screen, or Settings) instead of restarting a run.
  - Back from a place opened like this still follows the tree. Back from `#/library` opened by a link goes to Home, not out of the app.
- **FR-6** Forward must reopen a main screen or a course that Back just left. It must never reopen a lesson, the layout editor, or a dialog. Forward into one of those leaves the learner where they are.
- **FR-7** Leaving a screen by Back must act as leaving it in the app does today: the Player stops playing, a lesson releases its notes and stops Listen, the other hand, and the metronome, and nothing is recorded for an unfinished run. Back never loses saved data (progress, My lessons, settings, kept files).

## Non-functional requirements

- No new UI strings are expected. If one is needed, it goes through the translations module (English first, then `uk`, `de`, `fr`).
- Works with the on-screen and computer keyboard (no MIDI device required). Back works the same with a MIDI keyboard connected.
- No perceptible added input latency. A note press writes nothing to the history.
- Navigation stays plain app state: there is no router library. The history mirrors the app state, and the rules for it (parsing and formatting a hash, the step a change needs) are pure and unit-tested.
- Works with the service worker and offline: the hash never reaches the server, so both hosts and the offline navigation fallback need no change.
- No new dependencies.
- The saved data (progress, My lessons, lesson settings, the sheet style) is unchanged.

## Out of scope

- Deep links into a lesson (`#/lesson/<id>`), and reopening a lesson or the layout editor after a reload.
- Real paths instead of a hash (`/piano-tutor/library`): this needs a 404 page trick on GitHub Pages.
- A hash for the state inside a screen: the library filter or search, the open file in the Player, the Settings panels, the layout editor's chosen option.
- Changing the page title (`document.title`) per screen.
- A "press Back again to exit" prompt on Home.
- Sharing links between devices: a course link opens only on a device that has the piece (library pieces always do).

## Decisions

| Question                                           | Decision                                                                                                                                                                                                      | Reason                                                                                                                                                                                                                                                                                                                       |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Should the URL show the screen?                    | **Hash routes**, e.g. `#/library`.                                                                                                                                                                            | User choice (recommended). A reload stays on the screen. It is safe on both hosts and with the service worker's offline fallback, because the hash never reaches the server.                                                                                                                                                 |
| Which steps does Back walk through?                | **An app-like tree.** Home is the root, main screens are one level below it, and switching screens replaces the level. A course, a lesson, and the layout editor each add one level.                          | User choice (recommended). This is the Android app pattern. Back from any main screen goes to Home, and Back on Home leaves the app.                                                                                                                                                                                         |
| What does Back do in a running lesson?             | **Pause first.** The first Back opens the pause dialog, and a second Back exits.                                                                                                                              | User choice (recommended). It protects a run from an accidental edge swipe.                                                                                                                                                                                                                                                  |
| Do dialogs close on Back?                          | **Yes.** Back closes the Add lesson sheet. For the **pause dialog**, Back **exits the lesson** instead of resuming it (agent's reconciliation, open for review).                                              | User choice (recommended). The answers to the two questions above conflict for the pause dialog: if Back resumed, Back alone could never leave a lesson (pause, resume, pause, …). "A second Back exits" wins. Escape still resumes, as today. The reset confirmation is an inline box, not a dialog, so it is not affected. |
| What does a reload restore below the main screens? | **The course, not the lesson.** A course hash reopens a library piece's or a kept file's course. A lesson or the layout editor reopens the place below it. A file that was not kept falls back to the screen. | User choice (recommended). A reload should not restart a run. A file opened from disk is not stored anywhere, so its course cannot come back.                                                                                                                                                                                |
