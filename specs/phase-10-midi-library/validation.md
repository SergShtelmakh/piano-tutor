# Validation — MIDI library

The feature is done (and the branch can be merged) only when every box is checked.

## Automated

- [ ] `bun run lint` passes
- [ ] `bun run format:check` passes
- [ ] `bun run build` passes
- [ ] `bun run test` passes. New pure logic has unit tests: `browse` (filter, grouping, ordering in two locales), the marks rules, and the catalogue integrity checks against the files on disk (files exist and parse, durations match, sizes, every `.mid` listed, unique ids, licence allowlist, source host, check dates, composer and level coverage)
- [ ] CI is green on the PR

## Manual checks

Run `bun run dev` and open http://localhost:3000 in Chrome. Use the **Player** mode. Use the computer keyboard and the mouse unless a step says otherwise.

- [ ] FR-1: The library has about 30 pieces by at least 8 composers, all classical piano pieces (count them in the panel: the catalogue test also checks 24–40 and 8 composers).
- [ ] FR-2: **Licence spot check.** Open the Mutopia page of at least 8 pieces from the "Source" links, from different composers (include every composer at least once if you can), and confirm each page says **Public Domain**. Open `licenses/library-sources.md` and check it lists every piece with its URL, licence, and check date.
- [ ] FR-3: Titles read as the usual names of the works (with opus or catalogue numbers and the movement). Durations in the list match what you hear (play two pieces to the end).
- [ ] FR-4: Difficulty ratings feel right. Play one piece from each level 1 to 5: level 1 is slow and simple; level 5 is clearly hard. Each level has at least 2 pieces; levels 1–3 have at least 4 pieces each. **User adjusts any rating that feels wrong** (change one number in the catalogue).
- [ ] FR-5: The **Library** button is next to **Open MIDI file**. It opens and closes the panel; `aria-expanded` changes (DevTools → Accessibility). With the keyboard only: Tab to the button, Enter opens it, Tab moves through the filter and the rows.
- [ ] FR-6: Composers are in alphabetical order, in the UI language (check `en` and `uk`). Each heading shows the name and years, and collapses and expands. Within a composer, easy pieces come first. Each row shows the title, difficulty dots with the level name as text, the duration as `m:ss`, and ✓ / ★ when set.
- [ ] FR-7: The difficulty filter shows only pieces of the chosen level and hides composers with no match. **Favourites** shows only starred pieces. With no match a "No pieces match" message shows. A reload resets the filter.
- [ ] FR-8: Choosing a piece loads it: the score and controls appear, the panel closes, and it does **not** start by itself. Play starts it. Choosing another piece while one is playing stops the first with no stuck notes. While a file loads, the row says "Loading…".
- [ ] FR-9: For a library piece the info line shows the title, composer, difficulty (dots and name), and "Source: Mutopia Project · Public Domain". The link opens the piece's Mutopia page in a new tab. A file opened with **Open MIDI file** shows only its name.
- [ ] FR-10: ★ and ✓ toggle from the list and from the info line, and both stay in step. Reload the page: the marks are still there (check DevTools → Application → Local Storage → `piano-tutor.library`). Block site data (or use a private window): marks still work until the tab closes. Corrupt the stored value by hand: the app starts with no marks and no error.
- [ ] FR-11: Stop the dev server (or turn on DevTools → Network → Offline) and choose a piece: a translated message shows, the previous piece is still loaded, and nothing is broken. Also rename a file on disk temporarily: the same message shows for that piece.
- [ ] FR-12: Run `bun run build && bun run preview` (http://localhost:4173). Open one piece online. In DevTools → Application → Cache Storage, `piano-tutor-library` holds only that file, and the precache has no `.mid` files. Go offline and reload: that piece still opens; a piece you never opened shows the message.
- [ ] FR-13: The panel ends with the Mutopia credit and a link to mutopiaproject.org. `README.md` credits the Mutopia Project, states the licence policy, and says how to add a piece.
- [ ] FR-15: Every composer heading has a round portrait, and the info line of an open piece shows a larger one. Rename or remove one portrait file temporarily: its heading shows the composer's initials instead. Open the Commons page of at least 3 portraits (the list is in `licenses/library-sources.md`) and confirm each says **Public domain**. In `bun run preview`, go offline after one visit: the portraits still show. The panel footer credits Wikimedia Commons.
- [ ] No composer of Russian origin is in the library (check the list of composers in the panel).
- [ ] FR-14: Switch to `uk`, `de`, `fr`: the Library button, the panel text, the filter, the five difficulty names, the marks labels, the source line, the messages, and the composer names are translated; piece titles are not. **User skims the new translations (composer names especially).**
- [ ] At 360 px width (device mode): the panel, rows, filter, and info line fit; buttons are easy to hit; there is no horizontal page scroll.
- [ ] **Deployed:** on the Cloudflare branch preview and, after merge, on GitHub Pages (`/piano-tutor/`), a piece loads, plays, and (after one visit) opens offline.
- [ ] On a real Android phone: choose a piece from the library, play it, and see the score and keys follow; mark a favourite and reload.
- [ ] No console errors, online and offline.
- [ ] User-facing text comes from the translations module, with keys in all locales (`en`, `uk`, `de`, `fr`).
- [ ] **User confirms the licence policy** (only pieces whose own Mutopia page says "Public Domain") is acceptable for how the app will be used.

## Constitution follow-up

- [ ] `specs/roadmap.md`: Phase 10 status updated, with the outcome; the search box, sorting, and the other library ideas are in the Backlog
- [ ] `specs/tech-stack.md`: `src/library/` and the library files in the project layout; the runtime cache; known debt (the licence check is manual per piece, the notation of dense pieces, the mechanical sound)
- [ ] `CHANGELOG.md` and `README.md` updated
