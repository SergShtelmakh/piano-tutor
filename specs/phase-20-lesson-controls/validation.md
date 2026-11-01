# Validation — Lesson controls

The feature is done (and the branch can be merged) only when every box is checked.

## Automated

- [x] `bun run lint` passes
- [x] `bun run format:check` passes
- [x] `bun run build` passes
- [x] `bun run test` passes — `practice.test.ts`, and the new cases in `lesson.test.ts` and `course.test.ts`
- [x] `src/core/practice.ts` has no React, DOM, audio, storage, or timer use (read the imports, search for `setTimeout`, `Date`, `localStorage`, `AudioContext`)

## Manual checks

Run `bun run dev`, open http://localhost:3000 in Chrome.

- [ ] FR-1: In any lesson, **−** / **+** change the tempo by 5 between 40 and 200 (the buttons are disabled at the ends); default 80. Leave, open another lesson, reload: the tempo is kept.
- [ ] FR-2: In a built-in lesson press **Listen**: the page plays from the current step, one step per beat, keys light up, the button shows **Stop**; it stops by itself at the end of the page. In a course lesson, Listen follows the piece's rhythm (a half note lasts twice a quarter). Stop, Pause, Restart, and Back each stop it with no key left lit or sounding. At 40 and 200 bpm the speed changes accordingly.
- [ ] FR-3: Turn on **Metronome**: it clicks on every beat; **−** / **+** change the rate at once; Mute and volume affect it; it stops on the summary and on Pause, and starts again on Resume. Reload: the toggle is kept.
- [ ] FR-4: Press Listen and play nothing: no step advances and no mistake is counted. Play along during Listen: your notes are judged as usual.
- [ ] FR-5: A both-hands course lesson shows **Left / Both / Right** (Both pressed). A right-hand course lesson and a built-in lesson show no switch. Switching restarts the lesson at step 1.
- [ ] FR-6: In a both-hands lesson choose **Right**: the current step asks only for right-hand notes, left-only steps are skipped; finishing a step plays its left-hand notes, then any skipped left-hand steps in rhythm (faster at a higher tempo). Choose **Left**: the reverse. A chord split between the hands asks only for your hand's part.
- [ ] FR-7: Finish a one-hand run: the summary shows the accuracy and the practice note, no stars or XP; Home shows the same XP and streak as before; the lesson's card keeps its old stars. Finish with **Both**: stars are saved as usual.
- [ ] FR-8: Press **Pause** while Listen, the metronome, and the other hand play: all stop and no key stays lit. The overlay shows Resume / Restart / Exit; keys sound but do not advance or count mistakes; Resume continues at the same step; Restart starts at step 1; Exit goes back (to the course for a course lesson). Focus moves into the overlay and back to Pause.
- [ ] FR-9: Switch to another tab and back: the lesson is paused. With no control focused, **Space** pauses and resumes and does not scroll the page; with a control focused (Tab to **Hint**), Space activates that control and does not pause.
- [ ] FR-10: Turn on **Hint**: a ring marks the key(s) of the current step (all notes of a chord; in a one-hand run only your hand's) and moves with the steps. Off by default; reload keeps the choice. A three-star run with the hint on still gets three stars.
- [ ] FR-11: At 360 × 800 and 768 × 1024 the header shows Back, title, Pause, Mute, and a second row with the practice controls, no sideways scroll; at 1024 × 768, 1440 × 900, and 844 × 390 one row (at 844 × 390 Listen is an icon and the staff and piano still fit).
- [ ] Accessibility: Tab through the header and the overlay: focus rings everywhere; icon-only buttons have names (DevTools → Accessibility); toggles report `aria-pressed`; touch targets ≥ 44 px.
- [ ] Works with computer keyboard (`A`–`;`, `W E T Y U O P`, `Z` / `X`) without a MIDI device; a real MIDI keyboard on the Cloudflare preview with Listen and the other hand playing (no stuck notes, pedal works).
- [ ] No console errors
- [ ] User-facing text comes from the translations module, with keys in all locales (`en`, `uk`, `de`, `fr`); the user skims the new `uk` / `de` / `fr` strings

## Constitution follow-up

- [x] `specs/roadmap.md` — phase status updated
- [x] `specs/tech-stack.md` — layout (`practice.ts`, `src/lesson/`, `synth.click`), known debt
- [x] `CHANGELOG.md` / README (all four languages) updated
