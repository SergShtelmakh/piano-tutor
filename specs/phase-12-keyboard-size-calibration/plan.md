# Plan — Keyboard size & calibration

> Roadmap phase: Phase 12 — Keyboard size & calibration
> Branch: `feature/keyboard-size-calibration`
> Status: Implemented (manual validation open)

## Goal

The learner tells the app how big their real keyboard is (by key count or by pressing its lowest and highest key). Lessons then warn about notes the keyboard doesn't have, and the on-screen piano dims the keys outside it.

## Approach

- **Pure core** `src/core/keyboardRange.ts` (no React / DOM / audio):
  - `KeyboardRange = NoteRange | null` (reuse `NoteRange` from `keyboardLayout.ts`; `null` = not set).
  - `KEY_COUNTS = [25, 37, 49, 61, 76, 88]`, `rangeForKeyCount(count)` with the defaults from FR-3, `keyCount(range)`, `canShift(range, octaves)` / `shiftRange(range, octaves)` (±12, only inside A0–C8), `rangeFromNotes(a, b)` (sorted).
  - Calibration as a small state machine: `{ step: 'lowest' } → { step: 'highest', first } → { step: 'done', range }`, `calibrationPress(state, note)`; pressing `first` again is ignored.
  - `notesOutside(steps, range)` → `{ count, lowest?, highest? }` over distinct pitches (`lowest` = lowest note below the range, `highest` = highest note above it); `isOutside(note, range)` for the piano.
  - `parseKeyboardRange(raw)` / `serialiseKeyboardRange(range)`: `{ version: 1, low, high }`; anything invalid (wrong version, not integers, outside 21–108, `low >= high`) → `null`.
- **Adapters** `src/keyboard/`, same shape as `src/library/`:
  - `storage.ts` (`piano-tutor.keyboard`, try/catch on read and write; a failed write keeps the value in memory).
  - `context.ts` (`useKeyboardRange()` → `{ range, setRange }`) and `KeyboardRangeProvider.tsx`, added to the provider stack in `App.tsx`.
- **UI**
  - `MidiStatus` gets a `lessonOpen` prop and renders `KeyboardSizeControl` next to its status when Web MIDI is available and no lesson is open; it passes whether a device is connected (`status.state === 'connected'`).
  - `KeyboardSizeControl.tsx`: the **Keyboard** button (label from FR-2) and an inline panel below it (no modal): key-count buttons, octave down / up, Clear, Close, and Calibrate.
  - `useCalibration.ts` (in `src/keyboard/`): subscribes to the note bus while calibrating, passes only `noteon` with `source === 'midi'` to `calibrationPress`, and stops when `connected` turns false.
  - `PianoKeyboard`: `keyColor` gets an `outside` flag: dimmed white (`bg-slate-200`) and dimmed black (`bg-slate-500`) when no other colour applies. Lit and feedback colours stay as they are.
  - `LessonScreen`: `useMemo(() => notesOutside(lesson.steps, range))` and a notice above the staff / notation when `count > 0`.
- **Translations**: new keys in `locales/en.ts` first, then `uk`, `de`, `fr`. The warning uses a plural entry (`tp`) with `{lowest}` / `{highest}` interpolation; the button label uses `{count}` / `{low}` / `{high}`.

## Task groups

1. **Pure range core**
   - [x] `src/core/keyboardRange.ts`: types, key-count defaults, `keyCount`, `canShift` / `shiftRange`, `rangeFromNotes`, `isOutside`.
   - [x] Calibration state machine (`calibrationPress`).
   - [x] `notesOutside` (distinct pitches, lowest below / highest above).
   - [x] `parseKeyboardRange` / `serialiseKeyboardRange`.
   - [x] `keyboardRange.test.ts`: every default in the FR-3 table, shift limits (25 keys at the top / bottom, 76 and 88 can't move), calibration in both press orders and with a repeated note, out-of-range count with chords and repeated pitches, parse of valid / invalid / foreign data.
2. **Persistence and provider**
   - [x] `src/keyboard/storage.ts`, `context.ts`, `KeyboardRangeProvider.tsx`.
   - [x] Add the provider to `App.tsx`.
3. **Setting and calibration UI**
   - [x] `src/keyboard/useCalibration.ts` (bus subscription, MIDI-only, stop on disconnect, unsubscribe on unmount).
   - [x] `src/components/KeyboardSizeControl.tsx`: button, panel, key counts, octave buttons with disabled states, Clear, Close, Calibrate (unavailable with a reason when not connected), result with Save / Try again / Cancel.
   - [x] `MidiStatus`: `lessonOpen` prop, render the control; `App.tsx` passes `lessonOpen={entry !== undefined}`.
   - [x] New strings in `en`, `uk`, `de`, `fr`.
4. **Using the range**
   - [x] `PianoKeyboard`: dim keys outside the range (all modes); lit and feedback colours win.
   - [x] `LessonScreen`: out-of-range notice (FR-9) with its strings in all four locales.
   - [x] Check the panel and the notice at 360 px.

## Files touched

| File                                     | Change                                               |
| ---------------------------------------- | ---------------------------------------------------- |
| `src/core/keyboardRange.ts`              | New: pure range, defaults, calibration, out-of-range |
| `src/core/keyboardRange.test.ts`         | New: unit tests                                      |
| `src/keyboard/storage.ts`                | New: `piano-tutor.keyboard` persistence              |
| `src/keyboard/context.ts`                | New: `useKeyboardRange()`                            |
| `src/keyboard/KeyboardRangeProvider.tsx` | New: provider                                        |
| `src/keyboard/useCalibration.ts`         | New: calibration hook on the note bus                |
| `src/components/KeyboardSizeControl.tsx` | New: button and panel                                |
| `src/components/MidiStatus.tsx`          | `lessonOpen` prop, renders the control               |
| `src/components/PianoKeyboard.tsx`       | Dim keys outside the range                           |
| `src/components/LessonScreen.tsx`        | Out-of-range notice                                  |
| `src/App.tsx`                            | Provider; `lessonOpen` for `MidiStatus`              |
| `src/i18n/locales/{en,uk,de,fr}.ts`      | New strings                                          |

## New dependencies

None.

## Risks & open questions

- **Black keys at the range edges:** a calibrated range can start or end on a black key (some controllers start on E or F, both white, but a mis-press can pick a black key). It is stored as pressed; only the dimming and the warning use it, so no layout rule breaks.
- **Dimmed colour contrast:** dimmed white keys must still read as keys next to the slate page background. Check on a phone in daylight; adjust the two Tailwind classes if needed.
- **MIDI status ownership:** connection state lives inside `MidiStatus`. Rendering the control from there avoids moving MIDI state into a new context; if a later phase adds a device picker, the state may move to a provider then.
- **Random lessons:** built-in lessons build a new order on each start; `notesOutside` runs on the created lesson, so the notice always matches what is on screen.
