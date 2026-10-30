# Validation — MusicXML import

The feature is done (and the branch can be merged) only when every box is checked.

## Automated

- [x] `bun run lint` passes
- [x] `bun run format:check` passes
- [x] `bun run build` passes
- [x] `bun run test` passes — the XML reader, zip reader, MusicXML conversion, `positionOnClef`, the hand-aware `buildScore`, the course hand split, and `loadScoreFile` have unit tests; the existing MIDI, score, library, and course tests stay green (library courses unchanged)

## Manual checks

Run `bun run dev`, open http://localhost:3000 in Chrome. Prepare in MuseScore (3 or 4): a two-staff piano score whose melody goes below middle C, exported as **`.mxl`** and as **uncompressed `.musicxml`**; a score with a pickup bar; a score with piano + one other instrument; a `.mid` export of the same piece.

- [ ] FR-1: Player → **Open file**. The chooser offers `.mid`, `.mxl`, `.musicxml`, `.xml`. Open each prepared file: each opens. Rename the `.mxl` to `.mid` and open it: it still opens (detected by content).
- [ ] FR-2: the `.mxl` from MuseScore opens (it has `META-INF/container.xml`). Optional: a zip with only a `.musicxml` inside and no container also opens.
- [ ] FR-3: a file larger than 2 MB shows the "too large" message; the open piece stays.
- [ ] FR-4: open a `.txt`, a `.png`, and a `.zip` with no score: each shows the "not a supported file" message (naming MIDI and MusicXML); a truncated `.mxl` shows "damaged"; nothing crashes; the previous piece stays open.
- [ ] FR-5: the piano + other instrument score plays and shows the notes of both parts.
- [ ] FR-6: chords, two voices, and tied notes look and sound right (a tied note sounds once); grace notes are not played.
- [ ] FR-7: the score with a pickup bar shows bar lines where MuseScore shows them; its first bar starts with a rest.
- [ ] FR-8: the piece plays at 120 bpm with the slider at 100 %; the slider changes the speed; repeats are played once; pedal markings sustain the sound.
- [ ] FR-9 / FR-10: in the two-staff score, the low melody notes stay on the **treble** staff with ledger lines (as in MuseScore), and left-hand notes above middle C stay on the bass staff. The `.mid` export of the same piece still splits at middle C.
- [ ] FR-11: Learn on the `.mxl`: the right-hand stage contains the low melody notes; the left-hand stage doesn't.
- [ ] FR-12: a **Learn** button is shown next to the file name for the `.mxl`, `.musicxml`, and `.mid` files, and not for a library piece (it has its own Learn). The course screen shows the file name, no portrait or difficulty. **Open in Player** returns to the Player with the same piece.
- [ ] FR-13: finish a lesson of a file course: XP and streak go up, stars are shown in the course. Reload, open the same file, Learn: the stars are still there. Home's "Pieces you are learning" does not list the file. A library course still shows there.
- [ ] Course lessons from a file work with the computer keyboard (`A S D F…`) and the on-screen piano, without a MIDI device
- [ ] `bun run build && bun run preview`: opening an `.mxl` works in the production build (offline too, once loaded)
- [ ] No console errors
- [ ] User-facing text comes from the translations module, with keys in all locales (`en`, `uk`, `de`, `fr`); the user skims the reworded `uk` / `de` / `fr` strings

## Constitution follow-up

- [ ] `specs/roadmap.md` — phase status updated; backlog gains tempo marks, repeats, grace notes, key signatures from MusicXML, keeping opened files, `.mscz`
- [ ] `specs/tech-stack.md` — new core modules, `PieceNote.hand`, the course sources, and the debt note about the middle-C split updated
- [ ] `CHANGELOG.md` / README (all four languages) updated: opening MusicXML from MuseScore, Learn from your own file
