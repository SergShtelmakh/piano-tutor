# Requirements — Keyboard size & calibration

## Context

Roadmap Phase 12, from [`../backlog/keyboard-size.md`](../backlog/keyboard-size.md). Web MIDI does not say how many keys a device has: `MIDIInput` exposes only `id`, `name`, `manufacturer`, `version`, `state`, and `connection`, and MIDI carries only note numbers. Built-in lessons stay close to middle C, but course lessons (Phase 11) use a piece's real range and can ask for notes a 25- or 49-key controller doesn't have. The learner finds out only when the note can't be played.

This phase adds one setting, "my keyboard", saved on the device: a range of keys picked by key count or found by pressing the lowest and highest key. The range is used to warn in a lesson that has notes outside it, and to dim those keys on the on-screen piano. Nothing is transposed or blocked, and out-of-range notes can still be played on the on-screen or computer keyboard.

The answers to the clarifying questions are in **Decisions** below.

## Functional requirements

### Setting

- **FR-1** The app must keep one keyboard range for the device (not per MIDI device): either **not set** (the default) or a lowest and highest key inside A0–C8 (MIDI 21–108). It must be saved in `localStorage` under `piano-tutor.keyboard` as versioned JSON and survive a reload. Invalid or unreadable data must count as not set; blocked storage must keep the setting for the session.
- **FR-2** When Web MIDI is available (not `unsupported` / `insecure`), a **Keyboard** button must sit next to the MIDI status. Its label shows the setting: "Keyboard: not set", or the key count and range, for example "Keyboard: 61 keys (C2–C7)" with note names in the UI language (`noteLabelFor`). The button must be hidden while a lesson is open, so pressing keys for the setting is never judged as a lesson mistake.
- **FR-3** The button opens a panel where the learner can pick a key count: 25, 37, 49, 61, 76, or 88. Each count sets its default range:

  | Keys | Range | MIDI   |
  | ---- | ----- | ------ |
  | 25   | C3–C5 | 48–72  |
  | 37   | C3–C6 | 48–84  |
  | 49   | C2–C6 | 36–84  |
  | 61   | C2–C7 | 36–96  |
  | 76   | E1–G7 | 28–103 |
  | 88   | A0–C8 | 21–108 |

- **FR-4** The panel must have **Octave down** / **Octave up** buttons that move the whole range by 12 keys. A button is disabled when the move would leave A0–C8 (so 88 keys never moves, and 76 keys cannot move either).
- **FR-5** The panel must have a **Clear** action that sets the range back to not set, and a way to close it.

### Calibration

- **FR-6** When a MIDI device is connected, the panel must offer **Calibrate**: it asks "Press the lowest key on your keyboard", then "Press the highest key". Only `noteon` events with source `midi` that arrive after the step started count; the computer keyboard, the on-screen piano, and playback are ignored. The same note as the first press does not count as the second press.
- **FR-7** After two presses the panel must show the result (lower note to higher note, whichever order they were pressed in) with its key count, for example "C2–C7 · 61 keys", and offer **Save**, **Try again**, and **Cancel**. Save stores the range (any size, also non-standard ones like 32 keys); Cancel keeps the old setting. A calibrated range can then still be changed by hand (FR-3, FR-4).
- **FR-8** While no MIDI device is connected, Calibrate must be unavailable with a short reason ("Connect a MIDI keyboard to calibrate"). If the device disconnects during calibration, calibration must stop and the old setting stays.

### Using the range

- **FR-9** When the range is set, a lesson that has notes outside it must show a notice on the lesson screen, above the staff or notation, for example "3 notes in this lesson are not on your keyboard (lowest: D1)". It counts **distinct** pitches outside the range (plural forms through `tp`) and names the lowest note below the range and/or the highest above it. The lesson stays fully playable; the notice doesn't block, transpose, or change scoring. With no range set, or when every note fits, nothing is shown.
- **FR-10** When the range is set, keys of the on-screen piano outside it must be drawn dimmed (lower contrast, still clearly a white or black key) in every mode (free play, lessons, Player). They must still play, highlight when lit (blue), and flash right/wrong in a lesson. The piano's shown range (Phase 8 layout) does not change. With no range set, the piano looks as before.

## Non-functional requirements

- User-facing text goes through the translations module (English first, then `uk`, `de`, `fr`); note names use `i18n/noteNames.ts`.
- Works with the on-screen and computer keyboard: the manual setting (FR-3 to FR-5) needs no device, and nothing in this phase is needed to play.
- No perceptible added input latency: the out-of-range check runs once per lesson, and dimming is part of the existing key colour choice.
- Pure core: ranges, defaults, octave moves, the calibration steps, and the out-of-range count live in `src/core/` with no React, DOM, or audio imports, and are unit-tested.
- Calibration reads the note bus (architecture rule 1); it never reads a MIDI device directly.
- The panel works at 360 px width.

## Out of scope

- A separate range per MIDI device, and a MIDI device picker.
- Guessing the size from the device name.
- Transposing, skipping, or blocking lessons that don't fit; choosing lessons by range.
- Markers on lesson cards, course lists, or library pieces (only the lesson screen warns).
- Changing or limiting which keys the on-screen piano shows.
- A first-connect hint or any automatic prompt to calibrate.
- Lowest/highest-key detection without MIDI (the computer keyboard and touch have their own fixed ranges).

## Decisions

| Question                                         | Decision                                                                                                                                       | Reason                                                                                                                                |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| One range, or one per MIDI device id?            | **One global range** for the device.                                                                                                           | User choice. Most learners have one piano; no device picker needed. Device ids can change between browsers and systems.               |
| Lesson needs notes outside the range?            | **Warn, still playable.** No transpose, no block.                                                                                              | User choice. Keeps the music and lesson ids unchanged; a 25-key learner still sees every lesson.                                      |
| Effect on the on-screen piano?                   | **Dim keys outside the range**; the shown range is unchanged.                                                                                  | User choice. Shows where the real keyboard ends without changing the Phase 8 layout.                                                  |
| Lowest key for a manual key count?               | **Common defaults** (25 / 37 from C3, 49 / 61 from C2, 76 from E1, 88 from A0), with octave buttons for keyboards that start elsewhere.        | User choice. Calibration covers anything unusual.                                                                                     |
| Where does the setting live? Prompt for it?      | **A Keyboard button next to the MIDI status**, opening a panel. **No automatic hint.**                                                         | User choice.                                                                                                                          |
| Where is the out-of-range warning shown?         | **Only on the lesson screen.**                                                                                                                 | User choice. Lists and the library stay as they are.                                                                                  |
| Default when nothing is set?                     | **Not set**: no warnings, no dimming (not "88 keys").                                                                                          | Agent default. The app looks exactly as before until the learner sets a range.                                                        |
| Is the button shown without a connected device?  | **Yes, whenever Web MIDI is available**; only Calibrate needs a connected device. Hidden when Web MIDI is unsupported or the page is insecure. | Agent default. A learner can type in their key count before plugging in; without Web MIDI there is no real keyboard the range is for. |
| Settings button during a lesson?                 | **Hidden while a lesson is open.**                                                                                                             | Agent default. Calibration presses would otherwise be judged as lesson mistakes.                                                      |
| Count in the warning: notes or distinct pitches? | **Distinct pitches** outside the range, plus the lowest / highest of them.                                                                     | Agent default. "3 notes" means three keys the learner doesn't have, not how often they occur.                                         |
