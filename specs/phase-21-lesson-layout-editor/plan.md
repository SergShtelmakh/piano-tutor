# Plan — Lesson layout editor

> Roadmap phase: Phase 21 — Lesson layout editor
> Branch: `feature/lesson-layout-editor`
> Status: Draft

## Goal

From Settings the learner opens a full-window editor and sets how every lesson looks — keyboard height (also by dragging), octaves on screen, staff size, note names on keys, and the next-note hint — while a silent example plays; the choices are saved on the device and used by every lesson.

## Approach

- **Pure core**
  - `src/core/practice.ts`: `LessonSettings` gains `keyboardHeight: 's' | 'm' | 'l' | 'xl'`, `octaves: 'auto' | 2 | 3 | 4`, `staffSize: 's' | 'm' | 'l'`, `noteNames: boolean`. The parser keeps `version: 1` and falls back field by field; `DEFAULT_LESSON_SETTINGS` gets M / auto / M / false. A `resetLayout(settings)` helper returns the settings with the layout fields and `hint` at their defaults (FR-10).
  - New `src/core/lessonLayout.ts`: the size tables (`KEYBOARD_HEIGHTS` normal and short, the black-key share, `STAFF_SCALES`), `keyboardHeightPx(size, short)`, `snapKeyboardHeight(px, short)` (nearest size for a dragged height) and `stepKeyboardHeight(size, direction)` for the slider keys (FR-3, FR-4).
  - `src/core/keyboardLayout.ts`: `shownRange` takes an optional `octaves` (2 / 3 / 4); with it the range is that many octaves centred on `include` (or the base range), extended to cover all of `include`; `keyLayout` takes a minimum white-key width so a fixed count gives wider keys (`max(40, width / whites of N octaves)`) and scrolls when the range is wider (FR-5). `auto` keeps today's code path unchanged.
  - New `src/core/layoutExample.ts`: the example passage as a `Score` built in code (a few bars, treble melody plus bass notes, like the canvas) turned into a `Lesson` with `notation` by the existing course helpers, so the preview is drawn by the real `NotationView` (FR-2).
- **UI**
  - `PianoKeyboard`: new props `height` (`'s' | 'm' | 'l' | 'xl'`, default `'m'`), `octaves` (default `'auto'`), `allNames` (default `true`, so Free play and the Library keep today's labels), and `shown` (extra notes drawn lit without sound, for the example). Heights come from `lessonLayout.ts` (inline style; the `short` variant picks the short table via a media query hook or both values as CSS variables — whichever keeps one render path).
  - `StaffView` and `NotationView`: a `scale` prop (default 1). `StaffView` scales its max width and its short-screen max height; `NotationView` lays out systems for `width / scale` and draws the SVG at `scale`.
  - `LessonScreen`: reads the layout from `useLessonSettings()` and passes it to `PianoKeyboard`, `StaffView`, and `NotationView`.
  - New `useWindowSize` hook (`src/components/useWindowSize.ts`): the window's `innerWidth` × `innerHeight`, updated on `resize` (throttled to 250 ms); the editor shows it as a `role="status"` badge (FR-12).
  - New `LayoutEditorScreen.tsx` (full window, like a lesson): header (Back, title + subtitle, Reset, Done), the options panel (three `SegmentedControl`s and two `Switch`es, small components in the same file or `LayoutControls.tsx`), the preview (`NotationView` of the example in a dashed frame, the drag handle `KeyboardHeightHandle` with `role="slider"`, `PianoKeyboard` with the settings and `shown`/`hints`), and a timer that advances the example's step (a `useExampleLoop` hook: `setInterval`, paused on `visibilitychange`). Pointer drag on the handle uses pointer capture and `snapKeyboardHeight` relative to the height at the start of the drag.
  - `SettingsScreen`: a "Lesson layout" section with a description and an **Edit layout** button. `App.tsx`: a `layoutEditorOpen` state rendered like a lesson (outside `AppShell`); Back / Done close it and land on Settings.
  - Strings in all four locales; a sliders icon in `icons.tsx` for the Settings button.

## Task groups

1. **Pure rules and tests**
   - [ ] `LessonSettings` layout fields, parser (missing / invalid fields → defaults, `version: 1` kept), `resetLayout` (`practice.test.ts`).
   - [ ] `src/core/lessonLayout.ts` + tests: heights per size (normal, short), snapping (between sizes, beyond the ends), slider steps (clamped at S and XL), staff scales.
   - [ ] `shownRange` / `keyLayout` with fixed octaves + tests in `keyboardLayout.test.ts`: 2 / 3 / 4 octaves centred on the notes, a lesson wider than the count (covered, scrolls), the 40 px minimum on a narrow width, the A0–C8 ends, `auto` unchanged (existing tests still pass).
   - [ ] `src/core/layoutExample.ts` + test: a lesson with notation, both clefs, every step has notes.
2. **Lesson screen uses the layout**
   - [ ] `PianoKeyboard` props `height`, `octaves`, `allNames`, `shown`; labels per FR-7 (C keys and lit keys when `allNames` is false; computer letters unchanged).
   - [ ] `StaffView` / `NotationView` `scale`; check the short-screen limit at every size.
   - [ ] `LessonScreen` passes the settings; Free play and the Player pass nothing (today's look).
3. **The editor**
   - [ ] `LayoutEditorScreen` with header, panel (segmented controls, switches), preview, example loop, Reset.
   - [ ] `KeyboardHeightHandle`: pointer drag with snapping, slider keys and `aria-valuetext`.
   - [ ] Responsive layout (FR-11): panel at the right from `lg` / `short`, one column below; the panel scrolls on its own.
   - [ ] `useWindowSize` and the screen-size badge in the editor header (FR-12).
   - [ ] `SettingsScreen` section + `App.tsx` routing; the editor is outside the shell.
4. **Strings, docs, checks**
   - [ ] Strings in `en`, `uk`, `de`, `fr`.
   - [ ] `specs/tech-stack.md`: project layout (`lessonLayout.ts`, `layoutExample.ts`, the editor, the new settings fields).
   - [ ] Headless-Chrome run of the editor and a lesson at 360 × 800, 768 × 1024, 844 × 390, 1440 × 900 (script in the scratchpad, not in the repo).
5. **Validation**
   - [ ] Every item in `validation.md`.

## Files touched

| File                                                             | Change                                                   |
| ---------------------------------------------------------------- | -------------------------------------------------------- |
| `src/core/practice.ts` (+ test)                                  | Layout fields in `LessonSettings`, parser, `resetLayout` |
| `src/core/lessonLayout.ts` (+ test)                              | New: size tables, snapping, slider steps                 |
| `src/core/keyboardLayout.ts` (+ test)                            | Fixed octave counts, minimum key width                   |
| `src/core/layoutExample.ts` (+ test)                             | New: the editor's example lesson                         |
| `src/lesson/LessonSettingsProvider.tsx`, `settingsContext.ts`    | Setters for the new fields and reset                     |
| `src/components/PianoKeyboard.tsx`                               | `height`, `octaves`, `allNames`, `shown`                 |
| `src/components/StaffView.tsx`, `NotationView.tsx`               | `scale`                                                  |
| `src/components/LessonScreen.tsx`                                | Pass the layout                                          |
| `src/components/LayoutEditorScreen.tsx` (+ `LayoutControls.tsx`) | New: the editor                                          |
| `src/components/SettingsScreen.tsx`, `src/App.tsx`               | Section and routing                                      |
| `src/components/icons.tsx`                                       | Sliders icon                                             |
| `src/i18n/locales/{en,uk,de,fr}.ts`                              | New strings                                              |
| `specs/tech-stack.md`                                            | Project layout                                           |

## New dependencies

None.

## Risks & open questions

- **Short screens.** XL on a phone held sideways must still leave room for the header and staff; the short table (max 144 px) and the staff's height limit are meant to keep 844 × 390 on one screen — checked in the headless run at every size.
- **Notation scale.** `ScoreView` lays out lines for a width; scaling by drawing at `scale` with a narrower layout width must keep the cursor, clicks (not used in lessons), and the system scrolling right. If that gets messy, scale the whole SVG with CSS instead and keep the layout width — note it as a deviation.
- **Fixed octaves and focus.** With 2 octaves and a wide lesson the piano scrolls even on a wide monitor; the existing focus-following (`scrollTarget`) must keep the current step on screen.
- **Hint shared with the header.** The editor and the lesson write the same `hint` field; both read it from the one provider, so they cannot disagree.
