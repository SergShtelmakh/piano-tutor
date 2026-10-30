# Validation — Keyboard size & calibration

The feature is done (and the branch can be merged) only when every box is checked.

## Automated

- [ ] `bun run lint` passes
- [ ] `bun run format:check` passes
- [ ] `bun run build` passes
- [ ] `bun run test` passes — `src/core/keyboardRange.test.ts` covers the defaults, octave moves, calibration, the out-of-range count, and parsing

## Manual checks

Run `bun run dev`, open http://localhost:3000 in Chrome. Checks marked **(MIDI)** need a USB MIDI keyboard (for example the Roland FP-30X); the rest work without one.

- [ ] FR-1: Set 49 keys, reload: the button still says "49 keys (C2–C6)". In DevTools, set `piano-tutor.keyboard` to `{"version":1,"low":80,"high":40}` and reload: the button says "not set" and nothing is dimmed. Set it to `not json`: same result, no console error.
- [ ] FR-2: The Keyboard button sits next to the MIDI status before and after Connect. Its label is "not set" at first, then shows count and range. Switch the language to `uk`, `de`, `fr`: note names follow (`до2`, `C2`, `do2`). Open any lesson: the button disappears; leave the lesson: it comes back.
- [ ] FR-3: Pick each key count in turn; the label shows the range from the FR-3 table (25 C3–C5, 37 C3–C6, 49 C2–C6, 61 C2–C7, 76 E1–G7, 88 A0–C8).
- [ ] FR-4: With 25 keys, press Octave down until it is disabled (lowest start A0 not reachable from C, so it stops at C1–C3); press Octave up until it is disabled (stops at C6–C8). With 76 and 88 keys both buttons are disabled.
- [ ] FR-5: Clear sets the label back to "not set"; Close hides the panel without changing the setting.
- [ ] FR-6 **(MIDI)**: Connect, open the panel, press Calibrate, play a few computer keys (`A`, `S`) and on-screen keys: the prompt stays at "lowest key". Start a library piece in the Player before calibrating: playback notes don't count either. Press the lowest real key: the prompt moves to "highest key"; press the same key again: nothing happens.
- [ ] FR-7 **(MIDI)**: Press the highest key: the result shows the range and key count (88 on the FP-30X: A0–C8 · 88 keys). Try again restarts; Cancel keeps the old label; Save stores the range. Calibrate again, pressing the highest key first and the lowest second: the result is the same. Then change the saved range with Octave / key count by hand.
- [ ] FR-8: Without a connected device, Calibrate is unavailable and the reason is shown. **(MIDI)** Start calibrating and unplug the keyboard: calibration stops, the old setting stays.
- [ ] FR-9: Set 25 keys (C3–C5). Open a course lesson of a piece with a wide range (for example a left-hand lesson of a Bach or Beethoven piece): the notice shows the number of distinct missing pitches and the lowest / highest of them; the lesson plays and scores normally (play the out-of-range notes on the on-screen piano). Open "Around middle C": no notice. Clear the setting: no notice in the course lesson either.
- [ ] FR-10: With 25 keys set, in free play, a lesson, and the Player: keys outside C3–C5 are dimmed but play, light blue when held, and flash green / red in a lesson. Clear the setting: no keys are dimmed. The number of keys shown is the same as before in every mode.
- [ ] The panel and the notice fit at 360 px (DevTools device toolbar) without horizontal scrolling of the page.
- [ ] Works with the computer keyboard without a MIDI device (manual setting, warning, dimming).
- [ ] No console errors.
- [ ] User-facing text comes from the translations module, with keys in all locales (`en`, `uk`, `de`, `fr`); the user skims the new `uk` / `de` / `fr` strings, including the plural forms of the notice (1, 3, 5 notes).

## Constitution follow-up

- [ ] `specs/roadmap.md` — phase status updated
- [ ] `specs/tech-stack.md` — project layout gains `src/core/keyboardRange.ts` and `src/keyboard/`
- [ ] `specs/backlog/keyboard-size.md` — open questions answered (link to this spec) or note removed
- [ ] `CHANGELOG.md` / README (and its `uk` / `de` / `fr` translations) updated if user-visible
