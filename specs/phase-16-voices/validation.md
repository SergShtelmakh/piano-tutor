# Validation — Real notation: several voices per staff

The feature is done (and the branch can be merged) only when every box is checked.

## Automated

- [x] `bun run lint` passes
- [x] `bun run format:check` passes
- [x] `bun run build` passes
- [x] `bun run test` passes — voice ranking, per-voice columns, stems, rests, collisions, beams per voice, and unchanged one-voice scores have unit tests; the library and all-library course tests stay green

## Manual checks

Run `bun run dev`, open http://localhost:3000 in Chrome. Use a MuseScore export with two voices on one staff (a held note under a melody, for example `trio.musicxml`), `Pitces Of Memory.mxl`, and a library piece.

- [ ] FR-1: In the two-voice file the upper voice has stems up and the lower voice stems down, as in MuseScore. A file with a third voice still opens; its notes join one of the two.
- [ ] FR-2: A file with a melody part and a piano part: the melody notes are not drawn as a second voice of the piano.
- [ ] FR-3: A held note under a moving melody keeps its length (one long note, not cut); bars where only one voice plays look as before.
- [ ] FR-4: Lower-voice rests appear (lower on the staff) only in bars where the lower voice has notes; no extra rests elsewhere.
- [ ] FR-5: Notes of the two voices a second apart or on the same line don't overlap; the lower one sits a notehead to the right.
- [ ] FR-6: Beams never join the two voices; lower-voice beams hang below with stems down; ties stay within a voice; a sharp written in one voice holds for the other voice on the same line in that bar.
- [ ] FR-7: Playback, the cursor, blue sounding notes, and seeking line up; a held lower-voice note stays blue for its whole length.
- [ ] FR-8: A library piece (MIDI) looks exactly as before.
- [ ] FR-9: Learn on the two-voice file: the lessons and their step counts are the same as before this phase; part lessons show both voices.
- [ ] At 360 px the two-voice file reads without overlaps
- [ ] Course lessons and the Player work with the computer keyboard (`A S D F…`) without a MIDI device
- [ ] No console errors

## Constitution follow-up

- [ ] `specs/roadmap.md` — Phase 16 status updated; the "real notation" backlog note updated
- [ ] `specs/tech-stack.md` — the one-voice debt note updated
- [ ] `CHANGELOG.md` / README (all four languages) updated
