# Validation — Lesson content

The feature is done (and the branch can be merged) only when every box is checked.

## Automated

- [ ] `bun run lint` passes
- [ ] `bun run format:check` passes
- [ ] `bun run build` passes
- [ ] `bun run test` passes. New or changed pure logic has unit tests: catalog invariants, generators, paging, `nextLessonId`, `keyboardWindow`, `staffRow`
- [ ] CI is green on the PR

## Manual checks

Run `bun run dev` and open http://localhost:3000 in Chrome. Use the computer keyboard unless a step says otherwise.

- [ ] FR-1: Home lists 5 units with 13 lessons in the order of the FR-1 table, with the titles from that table. Each lesson opens and is playable to the end. Bass and both-clefs lessons use the octave starting at C3 (`A` plays C3).
- [ ] FR-2: Start "Middle C to G" twice; the orders differ, and no note comes twice in a row. In "Major chords" the same chord never comes twice in a row.
- [ ] FR-3: In every lesson, every target note can be played with the computer keyboard without pressing `Z` / `X` (checked while playing FR-1).
- [ ] FR-4: A random note lesson shows pages of 7, 7, and 6 notes. "Mary Had a Little Lamb" breaks at phrase ends, never more than 8 notes per page.
- [ ] FR-5 / FR-15: With fresh progress (Reset progress), "Middle C to G" has the "Next" badge. Finish it, go back: the badge moves to "Around middle C" (or to the first lesson without a run). Lessons further down can still be started.
- [ ] FR-6: In "Across middle C", bass notes are on the bass staff and C4 / D4 / E4 on the treble staff, with ledger lines where needed.
- [ ] FR-7: While playing, played notes turn grey, the current note is blue, and later notes are black. In a chord lesson, playing one note of the chord turns that note green while the rest stays blue.
- [ ] FR-8: In "Intervals", a second (e.g. C4 + D4) is drawn with the upper notehead to the right; thirds and wider are stacked. In "Major and minor chords" triads are stacked noteheads.
- [ ] FR-9: A wrong note flashes red on the key and on the current step. A right note flashes green. Finishing the last note of a page shows that page for the flash, then the next page.
- [ ] FR-10: With a screen reader or DevTools Accessibility pane, the staff label reads "Target note: …" for single notes and "Target notes: C, E, G" (in the UI language) for chords.
- [ ] FR-11: In DevTools device mode at 360 px width, an 8-note page and a chord page are readable; noteheads and ledger lines don't overlap; no horizontal scrolling.
- [ ] FR-12: Note lessons and chord lessons show their own instruction. In a chord lesson, the chord's notes can be played one after another in any order; a note outside the chord counts as a mistake.
- [ ] FR-13: Finish a chord lesson: the summary shows accuracy, stars, and XP; Home shows the result on its card.
- [ ] FR-14: Each unit has a heading; the cards under it show stars, best accuracy / "Not played yet", runs, and Start.
- [ ] FR-16: Switch to `uk`, `de`, `fr`: unit headings, lesson titles, instructions, the label, and the badge are translated. **User skims the new translations** (tune titles especially).
- [ ] Saved progress from Phase 5 (a result for "Note reading") still shows on the "Around middle C" card after upgrading.
- [ ] The melodies sound right when played (user plays each tune once).
- [ ] Works with the on-screen piano (touch / mouse), including a chord played one note at a time.
- [ ] Works with a MIDI keyboard if one is available (optional).
- [ ] No console errors.
- [ ] User-facing text comes from the translations module, with keys in all locales (`en`, `uk`, `de`, `fr`).

## Constitution follow-up

- [ ] `specs/roadmap.md`: phase status updated, outcome recorded (no locks; "Next" hint)
- [ ] `specs/backlog/`: note on locked lessons / unlock gates, in case they are wanted later
- [ ] `specs/tech-stack.md`: project layout updated (`staffRow.ts`, units, curriculum data)
- [ ] `CHANGELOG.md` / README updated
