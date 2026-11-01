# Validation — Lesson layout editor

The feature is done (and the branch can be merged) only when every box is checked.

## Automated

- [ ] `bun run lint` passes
- [ ] `bun run format:check` passes
- [ ] `bun run build` passes
- [ ] `bun run test` passes — new cases in `practice.test.ts`, `keyboardLayout.test.ts`, `scoreLayout.test.ts`, and the new `lessonLayout.test.ts`, `layoutExample.test.ts`
- [ ] `src/core/lessonLayout.ts`, `layoutExample.ts`, and the changes in `practice.ts` / `keyboardLayout.ts` / `scoreLayout.ts` have no React, DOM, audio, storage, or timer use

## Manual checks

Run `bun run dev`, open http://localhost:3000 in Chrome (the device toolbar in DevTools is enough to rotate and resize).

- [ ] FR-1: Settings shows **Lesson layout** with a description and **Edit layout**. The button opens a full-window editor without the rail / sidebar; Back and Done both return to Settings.
- [ ] FR-2: The editor shows a two-staff example that fills three lines of music; the cursor moves about every 0.75 s and starts over at the end; the current keys light up; nothing sounds. Pressing a piano key sounds and changes nothing. Switch to another tab and back: the loop continued from where it stopped (no burst of steps).
- [ ] FR-3: In the device toolbar choose 390 × 844 (portrait): the editor starts on **Portrait**. Set the keyboard to **XL**. Switch the panel to **Landscape**, set it to **S**. Open a course lesson in portrait: the piano is XL. Rotate to 844 × 390 inside the lesson: the piano becomes the landscape one (S), and the lesson keeps its step, mistakes, and progress. Rotate back: XL again. Reload: both layouts are kept. The preview says it is shown at this window's size.
- [ ] FR-4: **S / M / L / XL** change the piano height at once (M is the height a lesson had before this phase); the label above the piano names the size. On a phone held sideways (844 × 390) the default sizes keep header, staff, and piano on screen.
- [ ] FR-5: Drag the handle up and down with the mouse (and with touch emulation): the height snaps between the four sizes and the segmented control follows. Tab to the handle: arrow keys, Page Up / Down, Home / End change the size; a screen reader (DevTools → Accessibility) reports a slider with the size name.
- [ ] FR-6: With **Auto** the piano looks as before this phase. With **2**, a built-in right-hand lesson shows two octaves with wide keys at 1440 × 900; a course lesson with a wider range scrolls and follows the current step. With **4** at 360 × 800 the keys stay at least 40 px wide (the piano scrolls).
- [ ] FR-7: In a course lesson, **1 / 2 / 3** rows show that many lines of music (2 is as before this phase); in a built-in lesson the setting changes nothing and the control says so. Choose **3** rows with **XL** height on a phone held sideways: the notation box scrolls inside itself, the current line stays in view, and the piano is still on screen.
- [ ] FR-8: **S / M / L / XL** scale the rows: in a built-in lesson the staff is smaller / larger; in a course lesson **L** and **XL** fit fewer bars per line. M looks as before this phase. There is no separate "staff size" control.
- [ ] FR-9: Note names off (default): only C keys (with octave) and lit keys are named; computer letters still show. On: every white key is named as before. Free play and the Library name every key in both cases.
- [ ] FR-10: Turn on **Highlight the next note** in the editor: a lesson's **Hint** toggle is on and the ring shows; turn the lesson's Hint off: the editor's switch is off. Rotate the device: the hint stays as it was.
- [ ] FR-11: Change every setting in both orientations, reload: all are kept. In DevTools, set `piano-tutor.lessonSettings` to `{"version":1,"tempo":120,"metronome":true,"hint":false}` (a Phase 20 value), reload: tempo 120 and the metronome are kept, both layouts are at their defaults. Add `"layouts":{"portrait":{"keyboardHeight":"huge","rows":3},"landscape":7}`: in portrait only the keyboard height falls back to M and rows stay 3; landscape is all defaults.
- [ ] FR-12: **Reset** sets the layout being edited and the hint to M / Auto / 2 rows / M / names off / hint off at once; the other orientation's layout, a lesson's tempo, and the metronome are unchanged.
- [ ] FR-13: The header badge reads "Screen W × H px · Portrait / Landscape" with the real window size (compare with DevTools' device toolbar). Resize the window or switch the device emulation between 390 × 844 and 844 × 390: the numbers and the orientation follow within a moment. The badge is not a button and nothing is saved.
- [ ] FR-14: At 1024 × 768, 1440 × 900, and 844 × 390 the options panel is to the right of the preview (scrolling on its own when needed); at 360 × 800 and 768 × 1024 the options come first and the preview below; no sideways scroll except inside the piano.
- [ ] Accessibility: Tab through the editor: focus rings everywhere; segmented buttons report `aria-pressed`, switches `role="switch"` + `aria-checked`, the Back button has a name; size letters and row counts have translated names; touch targets ≥ 44 px.
- [ ] Works with the computer keyboard (`A`–`;`, `W E T Y U O P`, `Z` / `X`) without a MIDI device, in the editor and in a lesson with every layout; a real MIDI keyboard on the Cloudflare preview.
- [ ] No console errors
- [ ] User-facing text comes from the translations module, with keys in all locales (`en`, `uk`, `de`, `fr`); the user skims the new `uk` / `de` / `fr` strings

## Constitution follow-up

- [ ] `specs/roadmap.md` — phase status updated
- [ ] `specs/tech-stack.md` — project layout (`lessonLayout.ts`, `layoutExample.ts`, the editor, the layouts in the settings)
- [ ] `CHANGELOG.md` / README (all four languages) updated
