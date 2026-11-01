# Validation — Paper sheet music

The feature is done (and the branch can be merged) only when every box is checked.

## Automated

- [x] `bun run lint` passes
- [x] `bun run format:check` passes
- [x] `bun run build` passes
- [x] `bun run test` passes: new paper pairs in `config/themeContrast.test.ts` and the new `src/display/sheetStyle.test.ts`

## Manual checks

Run `bun run dev` and open http://localhost:3000 in Chrome. Clear `piano-tutor.sheetStyle` in DevTools → Application first.

- [ ] FR-1: Open a course lesson, a built-in lesson, a piece in the Library, and Settings → Edit layout. Each one shows its notation on a warm-white card. Notes, stems, beams, rests, clefs, signatures, accidentals, ties, ledger lines, and bar lines are near-black, and the staff lines are grey. A half or whole note is hollow with paper inside.
- [ ] FR-2: In a built-in lesson, play a right note: it turns dark teal, and the played notes are grey. Play a wrong note: the flash is dark red. In a course lesson, the current step is dark teal. In the Library, play a piece: the cursor and the sounding notes are dark teal. Everything stays easy to read on the card.
- [ ] FR-3: Choose **Dark** in Settings and repeat FR-1 and FR-2. The notation looks exactly as before this phase: light notes on the dark card, teal and coral states.
- [ ] FR-4: With no saved value, Settings → **Sheet music** shows **Paper** selected. Switch to Dark, open Edit layout: the example is dark. Back, switch to Paper, open Edit layout: the example is paper. The control works with Tab, the arrow keys, and Space.
- [ ] FR-5: Choose Dark and reload: it is still Dark. In DevTools set `piano-tutor.sheetStyle` to `blue` and reload: the notation is paper and there is no console error.
- [ ] FR-6: With paper on, the page background, the header, the other cards, the piano (white and black keys, key labels, lit keys, the hint ring), and the lesson controls look as before.
- [ ] At 390 × 844, 844 × 390, and 1440 × 900 the paper card has the same size and position as the dark one, and there is no sideways scroll.
- [ ] Works with the computer keyboard (`Q W E R…`) without a MIDI device
- [ ] No console errors
- [ ] User-facing text comes from the translations module, with keys in all locales (`en`, `uk`, `de`, `fr`). Ask the user to skim the new `uk`, `de`, and `fr` strings.

## Constitution follow-up

- [ ] `specs/roadmap.md`: phase status updated
- [ ] `specs/tech-stack.md`: the "Theme and shell" rule mentions the paper scope and its tokens
- [ ] `CHANGELOG.md` and README (all four) updated
