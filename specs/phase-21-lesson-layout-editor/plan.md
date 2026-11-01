# Plan — Lesson layout editor

> Roadmap phase: Phase 21 — Lesson layout editor
> Branch: `feature/lesson-layout-editor`
> Status: Draft

## Goal

From Settings the learner opens a full-window editor and sets how every lesson looks — separately for portrait and landscape: keyboard height (also by dragging), octaves on screen, the number of rows of music and their height, note names on keys — and the next-note hint, while a silent example plays; the choices are saved on the device and used by every lesson.

## Approach

- **Pure core**
  - New `src/core/lessonLayout.ts`:
    - `Orientation = 'portrait' | 'landscape'`, `orientationOf(width, height)` (height ≥ width is portrait, as the CSS `orientation` media feature).
    - `LessonLayout { keyboardHeight: 's' | 'm' | 'l' | 'xl'; octaves: 'auto' | 2 | 3 | 4; rows: 1 | 2 | 3; rowHeight: 's' | 'm' | 'l' | 'xl'; noteNames: boolean }` and `DEFAULT_LESSON_LAYOUT` (M / auto / 2 / M / false).
    - The size tables (`KEYBOARD_HEIGHTS` normal and short, `ROW_SCALES` 0.8 / 1 / 1.25 / 1.5), `keyboardHeightPx(size, short)`, `snapKeyboardHeight(px, short)` (nearest size for a dragged height), `stepSize(size, direction)` for the slider keys (clamped at S and XL).
    - `parseLayout(value)`: field by field, an invalid field takes its default.
  - `src/core/practice.ts`: `LessonSettings` gains `layouts: Record<Orientation, LessonLayout>`. The parser keeps `version: 1`; a missing `layouts` (Phase 20 data) or an invalid orientation entry gives the defaults, field by field. `DEFAULT_LESSON_SETTINGS` has two default layouts. `resetLayout(settings, orientation)` returns the settings with that orientation's layout and `hint` at their defaults (FR-12).
  - `src/core/keyboardLayout.ts`: `shownRange` takes an optional `octaves` (2 / 3 / 4); with it the range is that many octaves centred on `include` (or the base range), extended to cover all of `include`; `keyLayout` takes a minimum white-key width so a fixed count gives wider keys (`max(40, width / whites of N octaves)`) and scrolls when the range is wider (FR-6). `auto` keeps today's code path unchanged.
  - `src/core/scoreLayout.ts`: `visibleSystems(layout, time, rows = 2)` returns the current system and the next `rows - 1` (the existing two-line behaviour is the default, so the Player is unchanged) (FR-7).
  - New `src/core/layoutExample.ts`: the example passage as a `Score` built in code (about 12 bars, treble melody plus bass notes, like the canvas) turned into a `Lesson` with `notation` by the existing course helpers, so the preview is drawn by the real `NotationView` and fills three lines even at M on a wide window (FR-2).
- **UI**
  - `useOrientation` (in `src/components/useWindowSize.ts` with `useWindowSize`): the window's size from `innerWidth` × `innerHeight`, updated on `resize` (throttled to 250 ms), and the orientation from `orientationOf`. `LessonScreen` uses the layout of the current orientation, so a rotation changes only how the lesson is drawn (no remount, no reset of the lesson state).
  - `PianoKeyboard`: new props `height` (`'s' | 'm' | 'l' | 'xl'`, default `'m'`), `octaves` (default `'auto'`), `allNames` (default `true`, so Free play and the Library keep today's labels), and `shown` (extra notes drawn lit without sound, for the example). Heights come from `lessonLayout.ts` (inline style; the `short` variant picks the short table through a `matchMedia` hook, so one render path).
  - `StaffView` and `NotationView`: a `scale` prop (default 1) and, for `NotationView`, `rows` (default 2). `StaffView` scales its max width and its short-screen max height; `NotationView` lays out systems for `width / scale`, shows `rows` systems, and draws the SVG at `scale`. In `LessonScreen` the notation box is `min-h-0 flex-1 overflow-y-auto`, so rows that do not fit scroll inside it and the current line is scrolled into view (the piano keeps its place).
  - `LessonScreen`: reads the layout from `useLessonSettings()` and passes it to `PianoKeyboard`, `StaffView`, and `NotationView`.
  - New `LayoutEditorScreen.tsx` (full window, like a lesson): header (Back, title + subtitle, the screen-size badge, Reset, Done), the options panel (the Portrait / Landscape switch, four `SegmentedControl`s and two `Switch`es, small components in `LayoutControls.tsx`), the preview (`NotationView` of the example in a dashed frame with the "Shown at this window's size" note, the drag handle `KeyboardHeightHandle` with `role="slider"`, `PianoKeyboard` with the layout being edited and `shown` / `hints`), and a timer that advances the example's step (a `useExampleLoop` hook: `setInterval`, paused on `visibilitychange`). Pointer drag on the handle uses pointer capture and `snapKeyboardHeight` relative to the height at the start of the drag. The edited orientation is local state starting at the current orientation.
  - `LessonSettingsProvider` / `settingsContext.ts`: `setLayout(orientation, patch)` and `reset(orientation)` next to the existing setters.
  - `SettingsScreen`: a "Lesson layout" section with a description and an **Edit layout** button. `App.tsx`: a `layoutEditorOpen` state rendered like a lesson (outside `AppShell`); Back / Done close it and land on Settings.
  - Strings in all four locales; a sliders icon in `icons.tsx` for the Settings button.

## Task groups

1. **Pure rules and tests**
   - [ ] `src/core/lessonLayout.ts` + `lessonLayout.test.ts`: `orientationOf` (portrait, landscape, square), heights per size (normal, short), snapping (between sizes, beyond the ends), slider steps (clamped), row scales, `parseLayout` (missing / invalid fields).
   - [ ] `LessonSettings.layouts`, parser (Phase 20 data without `layouts`, one bad orientation, one bad field, `version: 1` kept), `resetLayout` (`practice.test.ts`).
   - [ ] `shownRange` / `keyLayout` with fixed octaves + tests in `keyboardLayout.test.ts`: 2 / 3 / 4 octaves centred on the notes, a lesson wider than the count (covered, scrolls), the 40 px minimum on a narrow width, the A0–C8 ends, `auto` unchanged (existing tests still pass).
   - [ ] `visibleSystems` with `rows` (1, 2, 3, near the last system) + tests; `src/core/layoutExample.ts` + test: a lesson with notation, both clefs, every step has notes, at least three systems at the editor's width.
2. **Lessons use the layout**
   - [ ] `useWindowSize` / `useOrientation`; `PianoKeyboard` props `height`, `octaves`, `allNames`, `shown`; labels per FR-9 (C keys and lit keys when `allNames` is false; computer letters unchanged).
   - [ ] `StaffView` / `NotationView` `scale` and `rows`; the scrolling notation box that keeps the current line in view; check the short-screen limit at every size.
   - [ ] `LessonScreen` passes the layout of the current orientation; a rotation redraws without resetting the lesson; Free play and the Player pass nothing (today's look).
3. **The editor**
   - [ ] `LayoutEditorScreen` with header, panel (orientation switch, segmented controls, switches), preview, example loop, Reset; `LessonSettingsProvider` setters.
   - [ ] `KeyboardHeightHandle`: pointer drag with snapping, slider keys and `aria-valuetext`.
   - [ ] Responsive layout (FR-14): panel at the right from `lg` / `short`, one column below; the panel scrolls on its own.
   - [ ] The screen-size badge in the editor header (FR-13).
   - [ ] `SettingsScreen` section + `App.tsx` routing; the editor is outside the shell.
4. **Strings, docs, checks**
   - [ ] Strings in `en`, `uk`, `de`, `fr`.
   - [ ] `specs/tech-stack.md`: project layout (`lessonLayout.ts`, `layoutExample.ts`, the editor, the layouts in the settings).
   - [ ] Headless-Chrome run of the editor and a lesson at 360 × 800, 768 × 1024, 844 × 390, 1440 × 900, and a rotation 390 × 844 → 844 × 390 inside a lesson (script in the scratchpad, not in the repo).
5. **Validation**
   - [ ] Every item in `validation.md`.

## Files touched

| File                                                             | Change                                                                     |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `src/core/lessonLayout.ts` (+ test)                              | New: orientation, layout type, size tables, snapping, slider steps, parser |
| `src/core/practice.ts` (+ test)                                  | `layouts` in `LessonSettings`, parser, `resetLayout`                       |
| `src/core/keyboardLayout.ts` (+ test)                            | Fixed octave counts, minimum key width                                     |
| `src/core/scoreLayout.ts` (+ test)                               | `visibleSystems` takes the number of rows                                  |
| `src/core/layoutExample.ts` (+ test)                             | New: the editor's example lesson                                           |
| `src/lesson/LessonSettingsProvider.tsx`, `settingsContext.ts`    | `setLayout`, `reset`                                                       |
| `src/components/useWindowSize.ts`                                | New: window size and orientation, throttled                                |
| `src/components/PianoKeyboard.tsx`                               | `height`, `octaves`, `allNames`, `shown`                                   |
| `src/components/StaffView.tsx`, `NotationView.tsx`               | `scale`, `rows`                                                            |
| `src/components/LessonScreen.tsx`                                | Pass the layout; scrolling notation box                                    |
| `src/components/LayoutEditorScreen.tsx` (+ `LayoutControls.tsx`) | New: the editor                                                            |
| `src/components/SettingsScreen.tsx`, `src/App.tsx`               | Section and routing                                                        |
| `src/components/icons.tsx`                                       | Sliders icon                                                               |
| `src/i18n/locales/{en,uk,de,fr}.ts`                              | New strings                                                                |
| `specs/tech-stack.md`                                            | Project layout                                                             |

## New dependencies

None.

## Risks & open questions

- **The phase is at the size limit.** Per-orientation layouts and rows made it larger than five small groups. If the implementation shows it is too big for one reviewable PR, split the per-orientation part (FR-3, the switch, the second layout) into a Phase 22 — the data shape (`layouts` keyed by orientation) is meant to make that cheap.
- **Short screens.** XL, three rows, and an XL piano together cannot fit on a phone held sideways; the notation box scrolls inside itself and the piano stays (FR-7). The short keyboard table (max 144 px) keeps the default and common choices on one screen at 844 × 390 — checked in the headless run at every size.
- **Notation scale and rows.** `ScoreView` lays out lines for a width; drawing at `scale` with a narrower layout width must keep the cursor and the line scrolling right. If that gets messy, scale the whole SVG with CSS instead and keep the layout width — note it as a deviation.
- **Keeping the current line in view.** With 1–3 rows the current line is the first, so only a scrolled box (rows that overflow) needs `scrollIntoView`; it must not fight the user's own scrolling (scroll only when the current line changes).
- **Fixed octaves and focus.** With 2 octaves and a wide lesson the piano scrolls even on a wide monitor; the existing focus-following (`scrollTarget`) must keep the current step on screen.
- **Rotation inside a lesson.** The layout changes with the window's shape, so a rotation must change only props, not the lesson's `key` or state; the headless run rotates inside a lesson to check it.
- **Hint shared with the header.** The editor and the lesson write the same `hint` field; both read it from the one provider, so they cannot disagree.
