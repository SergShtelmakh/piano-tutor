# Validation — Responsive on-screen keyboard

The feature is done (and the branch can be merged) only when every box is checked.

## Automated

- [x] `bun run lint` passes
- [x] `bun run format:check` passes
- [x] `bun run build` passes
- [x] `bun run test` passes. `keyboardLayout` has unit tests for the range rule at several widths, both ends of the piano, key geometry, and the scroll target
- [x] CI is green on the PR

## Manual checks

Run `bun run dev` and open http://localhost:3000 in Chrome. Use DevTools device mode for the widths. Use the computer keyboard unless a step says otherwise.

- [x] FR-1: At 1280 px, in free play and in a lesson, the piano spans the window with a 16 px gutter on each side; the title, controls, and staff stay in the column.
- [x] FR-2: Free play at the default octave: at 1000 px one extra octave is shown below the base range; at 1280 px one below and one above; at 2560 px (or zoomed out) all 88 keys, A0 to C8. Keys fill the width exactly; no white key is narrower than 40 px.
- [x] FR-2: Press `Z` until the lowest octave: the range stops at A0 and grows upward instead. Press `X` to the top: it stops at C8.
- [x] FR-3: At 360 px the piano shows white keys about 40 px wide and scrolls inside its box; the page has no horizontal scrollbar (also check 768 px and 1920 px).
- [x] FR-4: At 360 px (touch emulation, then a real phone): swiping on the keys plays notes and doesn't scroll; swiping on the octave ruler scrolls. The ruler shows C labels ("C3", "C4", … or "до3", … in `uk`). At 1280 px there is no ruler.
- [x] FR-5: At 360 px on first load, the base range is centred. Press `X`: the piano scrolls to the new range. Start "Middle C to G": the current note's key is in view; when the next note is outside the view, the piano scrolls to it. Holding a key down never triggers a scroll.
- [x] FR-6: Hold a key with the mouse, then shrink the window so that key disappears: the note stops (no stuck sound). Rotate a phone (or switch device-mode orientation): the range updates at once.
- [x] FR-7: Letters show only on the keys the computer keyboard plays; keys outside the base range play with mouse / touch and light up while held.
- [x] FR-8: In a lesson at 1280 px and at 360 px, right / wrong flashes show on the played key, including a wrong key outside the base range.
- [x] FR-9: The octave control reads "Computer keys B2–C5" by default and follows `Z` / `X`.
- [x] FR-10: Switch to `uk`, `de`, `fr`: the label and the ruler's accessible name are translated. **User skims the new translations.**
- [x] On a real Android phone in portrait and landscape: keys are easy to hit, multi-touch chords still work in "Major chords", and there is no visible lag.
- [x] Works with a MIDI keyboard if one is available (optional): notes outside the base range light up on the on-screen piano when it shows them.
- [x] No console errors.
- [x] User-facing text comes from the translations module, with keys in all locales (`en`, `uk`, `de`, `fr`).

## Constitution follow-up

- [x] `specs/roadmap.md`: Phase 8 status updated, with the outcome
- [x] `specs/tech-stack.md`: `keyboardLayout.ts` in the project layout; final key-width values
- [x] `specs/backlog/responsive-keyboard.md`: removed; what is left open is in the roadmap Backlog
- [x] `CHANGELOG.md` and `README.md` updated
