# Validation — Real notation: key signatures and spelling

The feature is done (and the branch can be merged) only when every box is checked.

## Automated

- [x] `bun run lint` passes
- [x] `bun run format:check` passes
- [x] `bun run build` passes
- [x] `bun run test` passes — spelling, key signatures (MIDI and MusicXML), the accidental rule, key-signature positions, the staff gap, and the layout widths have unit tests; the existing score, course, and library tests stay green (the all-library course test included)

## Manual checks

Run `bun run dev`, open http://localhost:3000 in Chrome. Use `Pitces Of Memory.mxl` (five flats), a library piece in a flat key, one in a sharp key, and one in C.

- [ ] FR-1: Open `Pitces Of Memory.mxl` in the Player: the key signature shows five flats on both staves, and D♭ / E♭ / B♭ notes carry no sign of their own, as on musescore.com. A MusicXML file with a key change shows the new signature at that bar.
- [ ] FR-2: Open a library piece in a flat key (e.g. one in F or B♭ major): flats in the signature, black keys spelled with flats. A piece in a sharp key (G or D major): sharps. A `.mid` without a key signature looks as before (sharps, no signature).
- [ ] FR-3: A MusicXML file with a double sharp or double flat (if at hand) shows the note at the same pitch as a single-sign spelling; nothing crashes.
- [ ] FR-4: The key signature repeats after the clef at the start of every system; C major shows none. Sharps and flats sit at the standard places on both staves (compare with MuseScore).
- [ ] FR-5: In a flat key, a G natural gets a ♮; the next G in the same bar gets none; in the next bar the key applies again. A tied note across the bar line gets no new sign.
- [ ] FR-6: D♭4 sits on the D position (not on C with a sharp).
- [ ] FR-7: In `Pitces Of Memory.mxl`, the left-hand chord D♭4–F4 sits clearly above the bass staff with its ledger line and no longer seems to belong to the treble staff. The space between the staves is the same in every system. A piece with nothing between the staves shows the 4-space minimum.
- [ ] FR-8: At 360 px and on a wide screen, the first notes of every system start after the key signature; no overlap.
- [ ] FR-9: Playback, the cursor, the blue sounding notes, and seeking by click still line up with the notes.
- [ ] FR-10: Learn on `Pitces Of Memory.mxl`: part lessons show the five-flat signature and flats; the notes drill shows the key too.
- [ ] FR-11: A built-in lesson (Home → any lesson) looks as before apart from the wider space between the staves; judging is unchanged.
- [ ] FR-12: The on-screen piano labels, the current-step label, and the out-of-range notice still use sharps.
- [ ] Course lessons and the Player work with the computer keyboard (`A S D F…`) without a MIDI device
- [ ] No console errors

## Constitution follow-up

- [ ] `specs/roadmap.md` — Phase 14 status updated; Phases 15 (beams) and 16 (voices) planned
- [ ] `specs/tech-stack.md` — `spelling.ts`, the key model, the staff gap; the notation debt note updated
- [ ] `CHANGELOG.md` / README (all four languages) updated
