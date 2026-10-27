# Requirements — Responsive on-screen keyboard

## Context

Roadmap Phase 8, from a backlog note on the responsive on-screen keyboard (removed after this phase; its decisions are in the table below). Today the on-screen piano always shows the same 26 keys (`keyboardRange(baseOctave)`: the B below the base C, two octaves, and the top C, so 16 white keys). It sits in the 768 px text column and stretches the keys to fill it:

- On a phone in portrait (about 330 px for the piano), a white key is about 20 px wide, which is too thin to hit with a finger.
- On a wide monitor, the column wastes most of the screen, and nothing beyond the 26 keys can be played with the mouse.

This phase makes the piano fit its screen: **full window width**, **more octaves when they fit**, and **horizontal scrolling when even the base range doesn't fit** at a finger-friendly width. The keyboard-size setting and calibration for a real MIDI keyboard from [`backlog/keyboard-size.md`](../backlog/keyboard-size.md) are split out as Phase 9.

Terms used below:

- **Base range:** the 26 keys from `keyboardRange(baseOctave)` (16 white keys). The computer keyboard (`A`–`;`, `W E T Y U O P`, `ShiftLeft`) plays notes inside it. `Z` / `X` and the octave buttons move it. In a lesson, it is set from the lesson's base octave, and every lesson note lies inside it (Phase 6, FR-3).
- **Shown range:** the keys the piano renders. It always contains the base range.
- **Full piano:** A0 (MIDI 21) to C8 (MIDI 108), 52 white keys.

The clarifying questions and their answers are in the **Decisions** table. Rows marked _(agent default)_ were not asked; please review them.

## Functional requirements

**Size and range (pure core)**

- **FR-1** The on-screen piano is as wide as the window, minus a 16 px gutter on each side. It is not limited to the text column, wherever it is shown (free play and lessons). Everything else stays in the column.
- **FR-2** The shown range is chosen from the piano's width, with a **minimum white-key width of 40 px**:
  1. Start with the base range.
  2. While one more whole octave (7 white keys) fits at ≥ 40 px per white key, add an octave, **alternating below and above** the range, starting below. Never go past A0 or C8. If one side has reached the end of the full piano, keep adding on the other side. Near A0, a partial octave down to A0 is allowed.
  3. The white keys then **stretch** to fill the width exactly.

  So a 1280 px window shows the base range plus about two octaves, and a 2560 px window shows all 88 keys.

- **FR-3** If even the base range doesn't fit at 40 px per white key (narrower than 16 × 40 = 640 px of piano), the piano shows the base range with white keys exactly 40 px wide and **scrolls horizontally inside its own box**. The page itself never scrolls sideways.

**Scrolling (narrow screens)**

- **FR-4** Touching or clicking a key always **plays** it; a swipe on the keys never scrolls the piano, so playing isn't disturbed. Scrolling happens on an **octave ruler**: a strip about 28 px tall above the keys that labels each C (for example "C3", in the note-name style of the UI language). Swiping on the ruler with a finger, dragging the scrollbar, or using a trackpad / Shift + mouse wheel scrolls the piano. The ruler is shown only while the piano scrolls.
- **FR-5** The view follows the music. It scrolls smoothly only when the notes it needs are not already fully in view:
  - on first show and after a resize or rotation, the base range is centred;
  - after `Z` / `X` or the octave buttons, it scrolls so the new base range is in view (as much as fits, starting from its lower end);
  - in a lesson, when the step changes, the current step's notes are brought into view.

  It never scrolls while the learner is holding a key down.

**Behaviour that must not change**

- **FR-6** Resizing the window or rotating the device recomputes the range at once (the container is observed, not just the window). A key that disappears from the shown range while it is held is released (`noteoff`), so no note gets stuck.
- **FR-7** Only keys inside the computer-keyboard window show their computer-key letter (as now). White keys keep their note names, C keys with the octave number. Keys outside the base range are fully playable with touch and mouse, and the synth, held-note highlight, and lesson judging work for them like any key.
- **FR-8** In a lesson, the right / wrong flashes and the held-key highlight work as in Phase 6 on every shown key, and the current target is always visible or brought into view (FR-5).
- **FR-9** The octave control keeps its role, but its label now names what it moves: "Computer keys" (translated) followed by the base-range span (for example "B2–C5").

**Translations**

- **FR-10** New and changed strings (the octave-control label, the ruler's accessible label "Scroll the piano") exist in `en`, `uk`, `de`, `fr`. Ruler labels use `i18n/noteNames.ts`.

## Non-functional requirements

- User-facing text goes through the translations module (English is the default; `uk`, `de`, and `fr` get the keys too).
- Works with the on-screen and computer keyboard (no MIDI device required).
- No perceptible added input latency: the range is computed when the size or the base octave changes, never per note event. A resize doesn't re-render more than once per animation frame.
- Pure core: the range rule (FR-2, FR-3), white-key geometry (x and width of every key), and the scroll target (FR-5) live in `src/core/keyboardLayout.ts` with unit tests. The `ResizeObserver` and scrolling stay in a thin hook / component.
- No new runtime dependencies.

## Out of scope

- The keyboard-size setting, calibration, and "this note is not on your keyboard" warnings (Phase 9).
- Pinch-to-zoom or a user setting for key width.
- A "rotate to landscape" hint.
- Glissando (sliding a finger onto the next key plays it). It stays in the backlog.
- Moving the base range by tapping the ruler.
- Changes to the staff, lessons, or their content range.

## Decisions

| Question                                    | Decision                                                                                                                         | Reason                                                                                             |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Scope                                       | Split: Phase 8 = responsive on-screen piano; Phase 9 = keyboard size + calibration                                               | User choice: keeps each phase one small PR.                                                        |
| Narrow screens                              | Keys keep a finger-friendly width and the piano scrolls horizontally                                                             | User choice.                                                                                       |
| Wide screens                                | The piano uses the full window width and shows more octaves, up to all 88 keys                                                   | User choice.                                                                                       |
| Where extra keys go                         | Around the base range (whole octaves, alternating below / above); `Z` / `X` and the octave buttons move it, and the view follows | User choice: the computer-keyboard keys stay in the middle.                                        |
| Scroll vs play on touch _(agent default)_   | Keys always play; scrolling only on an octave ruler above the keys (plus the scrollbar / trackpad)                               | A swipe on the keys can't mean both "play" and "scroll"; Android scrollbars can't be dragged.      |
| Minimum white-key width _(agent default)_   | 40 px                                                                                                                            | A common touch-target size; 16 keys then need 640 px, so phones in landscape usually don't scroll. |
| Octaves added first below _(agent default)_ | Alternate, starting below                                                                                                        | The base range starts at octave 3 by default, so the bass side is useful for the left hand.        |
| Octave control label _(agent default)_      | "Computer keys B2–C5"                                                                                                            | Once the piano shows more than the base range, "Range" would be misleading.                        |
| Branch base _(agent default)_               | `feature/responsive-keyboard` starts from `feature/pwa-offline` (Phases 6 and 7 not merged yet)                                  | Needs the latest code; rebase onto `main` once the earlier phases are merged.                      |
