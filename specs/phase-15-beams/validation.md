# Validation — Real notation: beams

The feature is done (and the branch can be merged) only when every box is checked.

## Automated

- [x] `bun run lint` passes
- [x] `bun run format:check` passes
- [x] `bun run build` passes
- [x] `bun run test` passes — beats per metre, beam groups, secondary beams and hooks, and the beam geometry have unit tests; the existing score, layout, course, and library tests stay green (the all-library course test included)

## Manual checks

Run `bun run dev`, open http://localhost:3000 in Chrome. Use `Pitces Of Memory.mxl` (3/4, eighths), a library piece with sixteenths (Bach Invention 2, or the Fantaisie-Impromptu), and a piece in 6/8 if one is at hand.

- [ ] FR-1: In `Pitces Of Memory.mxl` the right-hand eighths are beamed in pairs (one pair per beat), as on musescore.com; a lone eighth keeps its flag.
- [ ] FR-2: In 4/4 sixteenths are beamed in fours; in 6/8 (or 12/8) eighths are beamed in threes; in 3/4 eighths in pairs.
- [ ] FR-3: An eighth, a rest, and an eighth in one beat are not joined; a quarter note ends a group; nothing is beamed across a bar line. Tied eighths are beamed.
- [ ] FR-4: A MusicXML file and a MIDI file of the same piece show the same beams.
- [ ] FR-5: All stems of a group point the same way; beamed notes have no flags.
- [ ] FR-6: A rising group has a beam rising gently (never steeper than one staff space), a falling one falls, a group starting and ending on the same note has a flat beam; no stem is shorter than a normal stem.
- [ ] FR-7: Sixteenths have a second beam; a dotted eighth + sixteenth shows a short hook on the sixteenth.
- [ ] FR-8: Ties, dots, sharps / flats on beamed notes look right; playback, the cursor, the blue sounding notes, and click-to-seek still line up.
- [ ] FR-9: A course part lesson of a piece with eighths shows beams; a drill (quarter notes) shows none.
- [ ] At 360 px, beams do not run into neighbouring notes
- [ ] Course lessons and the Player work with the computer keyboard (`A S D F…`) without a MIDI device
- [ ] No console errors

## Constitution follow-up

- [ ] `specs/roadmap.md` — Phase 15 status updated
- [ ] `specs/tech-stack.md` — `beams.ts` added to the layout; the notation debt note updated
- [ ] `CHANGELOG.md` / README (all four languages) updated
