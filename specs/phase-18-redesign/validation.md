# Validation — Redesign: visual system and navigation

The feature is done (and the branch can be merged) only when every box is checked.

Design reference: the user's canvas [Piano Tutor — оновлений дизайн](https://claude.ai/artifact/8TBSo2UjJ2PTqZ4hoMbcrn).

## Automated

- [ ] `bun run lint` passes
- [ ] `bun run format:check` passes
- [ ] `bun run build` passes
- [ ] `bun run test` passes — `contrast.ts` has unit tests; `config/themeContrast.test.ts` checks the token pairs; `config/fontFiles.test.ts` checks the font files and licence record

## Manual checks

Run `bun run dev`, open http://localhost:3000 in Chrome. Use DevTools device mode for the sizes below.

- [ ] FR-1: On every screen (Home, Lessons, a course, a lesson and its summary, Library with a piece open, Free play, Settings) the page is dark; no white or light-slate panels remain, except the piano's white keys.
- [ ] FR-2: DevTools → Network: Manrope loads from the app's own origin, no request to `fonts.googleapis.com` / `fonts.gstatic.com`. Switch the language to Українська, Deutsch, Français: Cyrillic, `ä ö ü ß`, `é è à ç` all render in Manrope (Computed → Rendered fonts).
- [ ] FR-3: The rail / sidebar and Home show logo 13. `bun run build && bun run preview`: the tab favicon and the install icon (Application → Manifest) show the new logo; the manifest theme and background colours are `#0E1117`; the Android status bar is dark.
- [ ] FR-4: In a built-in lesson: the current note is teal; press a right key → teal flash on key and note; press a wrong key → red/coral flash, clearly different from teal also in DevTools → Rendering → "Emulate vision deficiency: achromatopsia". In a two-staff course lesson the current bass note is amber. In the Library, sounding notes and keys are teal.
- [ ] FR-5: Every screen is reachable: Home, Lessons, Library, Free play, Settings; a course opens from Lessons ("Pieces you are learning") and from Library (Learn); a lesson opens from Lessons, from the Continue card, and from a course.
- [ ] FR-6: At 360 × 800: Home shows tiles, no bottom bar; each other screen has Back + title; Back returns to Home; Back in a course lesson returns to the course; no horizontal scroll on any screen.
- [ ] FR-7: At 1024 × 768 a rail with icons and labels is on the left and marks the current screen; at 1440 × 900 a sidebar with logo and labelled rows. Top-level screens have no Back button there. Tab through the rail: each item has a focus ring and `aria-current` on the current one.
- [ ] FR-8: Open a lesson at 1024 × 768: the rail is gone; the header has Back, title, subtitle, a progress bar that advances with each step, and a mute button that silences the piano; the staff card and piano match the canvas's "Active lesson" layout.
- [ ] FR-9: Home with fresh progress: the Continue card names the first lesson and opens it. Finish all built-in lessons (or set progress in DevTools) → the card is hidden. The stats strip shows level, XP bar, streak. Block site data → the "not saved" note appears. At 844 × 390 the Continue card and tiles are side by side.
- [ ] FR-10: Lessons shows the units, stars, the Next badge, "Pieces you are learning" (after finishing a course lesson), and Reset progress (confirm and cancel both work).
- [ ] FR-11: Library with no piece open shows the library panel; filter by difficulty and favourites, mark a piece, open it: play / pause / stop, tempo, seek by slider and by clicking the score all work; open a `.mid` and an `.mxl` file from disk; Learn opens the course.
- [ ] FR-12: Free play: hint, octave buttons (and `Z` / `X`), mute button, full-width piano; keys play with mouse, touch, and computer keys.
- [ ] FR-13: Settings: change the language (the whole UI switches and the choice survives a reload); connect MIDI, leave Settings, play on the MIDI keyboard in Free play and in a lesson (still connected); set the keyboard size and calibrate; volume, mute, reverb work and are remembered; the build line is shown. No settings controls are stacked above other screens any more.
- [ ] FR-14: The course screen and the lesson summary (finish a lesson with a level-up if possible) use the card style; Retry and Back work.
- [ ] FR-15: Update banner (build, preview, rebuild, reload), offline-ready note, keyboard-range notice (set a 25-key range and open a lesson with notes outside it), and the sample load-failed text (block `/piano/` in DevTools) are all readable.
- [ ] FR-16: A built-in lesson (StaffView) and a library piece with beams, ties, two voices, a key signature, and ledger lines (ScoreView) draw light-on-dark; nothing is missing or misplaced compared with `main`.
- [ ] FR-17: The piano has ivory keys, dark black keys, teal pressed keys; out-of-range keys (25-key range) are visibly dimmed; the octave ruler at 360 px is readable and still scrolls.
- [ ] Accessibility: Tab through Home, Settings, and a lesson: every control has a visible focus ring; all icon-only buttons are announced with a name (DevTools → Accessibility); touch targets ≥ 44 px (spot check in device mode).
- [ ] Phone landscape (844 × 390): a lesson shows header, staff, and piano; note whether the page scrolls (FR "should").
- [ ] Works with computer keyboard (`A`–`;`, `W E T Y U O P`, `Z` / `X`) without a MIDI device
- [ ] Real MIDI keyboard (Roland FP-30X or similar) on the Cloudflare preview: connect in Settings, play a lesson, unplug / replug.
- [ ] Offline: `bun run build && bun run preview`, load once, go offline, reload: the font, the logo, and all screens work.
- [ ] No console errors
- [ ] User-facing text comes from the translations module, with keys in all locales (`en`, `uk`, `de`, `fr`); the user skims the new `uk` / `de` / `fr` strings

## Constitution follow-up

- [ ] `specs/roadmap.md` — Phase 18 status updated; Phases 19–21 still match the canvas
- [ ] `specs/tech-stack.md` — Styling row, layout, font licence line
- [ ] `CHANGELOG.md` / README (all four languages) updated
