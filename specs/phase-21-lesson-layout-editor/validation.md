# Validation — Lesson layout editor

The feature is done (and the branch can be merged) only when every box is checked.

## Automated

- [ ] `bun run lint` passes
- [ ] `bun run format:check` passes
- [ ] `bun run build` passes
- [ ] `bun run test` passes — new cases in `practice.test.ts`, `keyboardLayout.test.ts`, and the new `lessonLayout.test.ts`, `layoutExample.test.ts`
- [ ] `src/core/lessonLayout.ts`, `layoutExample.ts`, and the changes in `practice.ts` / `keyboardLayout.ts` have no React, DOM, audio, storage, or timer use

## Manual checks

Run `bun run dev`, open http://localhost:3000 in Chrome.

- [ ] FR-1: Settings shows **Lesson layout** with a description and **Edit layout**. The button opens a full-window editor without the rail / sidebar; Back and Done both return to Settings.
- [ ] FR-2: The editor shows a two-staff example; the cursor moves about every 0.75 s and starts over at the end; the current keys light up; nothing sounds. Pressing a piano key sounds and changes nothing. Switch to another tab and back: the loop continued from where it stopped (no burst of steps).
- [ ] FR-3: **S / M / L / XL** change the piano height at once (M is the height a lesson had before this phase); the label above the piano names the size. Open a lesson: the piano has the chosen height. On a phone held sideways (844 × 390) every size keeps header, staff, and piano on screen.
- [ ] FR-4: Drag the handle up and down with the mouse (and with touch emulation): the height snaps between the four sizes and the segmented control follows. Tab to the handle: arrow keys, Page Up / Down, Home / End change the size; a screen reader (DevTools → Accessibility) reports a slider with the size name.
- [ ] FR-5: With **Auto** the piano looks as before this phase. With **2**, a built-in right-hand lesson shows two octaves with wide keys at 1440 × 900; a course lesson with a wider range scrolls and follows the current step. With **4** at 360 × 800 the keys stay at least 40 px wide (the piano scrolls).
- [ ] FR-6: **S / M / L** scale the example's notation; in a built-in lesson the staff is smaller / larger; in a course lesson **L** fits fewer bars per line. At 844 × 390 the notation and piano fit at every size.
- [ ] FR-7: Note names off (default): only C keys (with octave) and lit keys are named; computer letters still show. On: every white key is named as before. Free play and the Library name every key in both cases.
- [ ] FR-8: Turn on **Highlight the next note** in the editor: a lesson's **Hint** toggle is on and the ring shows; turn the lesson's Hint off: the editor's switch is off.
- [ ] FR-9: Change every setting, reload: all are kept. In DevTools, set `piano-tutor.lessonSettings` to `{"version":1,"tempo":120,"metronome":true,"hint":false}`, reload: tempo 120 and the metronome are kept, the layout is at its defaults. Set `"keyboardHeight":"huge"`: only that field falls back to M.
- [ ] FR-10: **Reset** sets M / Auto / M / names off / hint off at once; a lesson's tempo and metronome are unchanged.
- [ ] FR-11: At 1024 × 768, 1440 × 900, and 844 × 390 the options panel is to the right of the preview (scrolling on its own when needed); at 360 × 800 and 768 × 1024 the options come first and the preview below; no sideways scroll except inside the piano.
- [ ] Accessibility: Tab through the editor: focus rings everywhere; segmented buttons report `aria-pressed`, switches `role="switch"` + `aria-checked`, the Back button has a name; size letters have translated names; touch targets ≥ 44 px.
- [ ] Works with the computer keyboard (`A`–`;`, `W E T Y U O P`, `Z` / `X`) without a MIDI device, in the editor and in a lesson with every layout; a real MIDI keyboard on the Cloudflare preview.
- [ ] No console errors
- [ ] User-facing text comes from the translations module, with keys in all locales (`en`, `uk`, `de`, `fr`); the user skims the new `uk` / `de` / `fr` strings

## Constitution follow-up

- [ ] `specs/roadmap.md` — phase status updated
- [ ] `specs/tech-stack.md` — project layout (`lessonLayout.ts`, `layoutExample.ts`, the editor, the settings fields)
- [ ] `CHANGELOG.md` / README (all four languages) updated
