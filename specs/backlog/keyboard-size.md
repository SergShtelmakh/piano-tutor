# Keyboard size and calibration

## Problem

Web MIDI does not report how many keys a device has. `MIDIInput` exposes only `id`, `name`, `manufacturer`, `version`, `state` and `connection`, and MIDI itself carries only note numbers (0–127). Lessons can therefore ask for notes the connected keyboard doesn't have (e.g. a 25-key controller and a lesson in the low octaves), and the on-screen piano can't match the real device.

## Idea

- A setting for the number of keys (25 / 37 / 49 / 61 / 76 / 88), stored per device `id` in `localStorage`.
- Calibration: ask the user to press the lowest and the highest key, and take the range from those two notes. The result fills the setting above and can still be edited by hand.
- Use the range to keep lessons inside it, to warn when a target note is outside the keyboard ("this note is not on your keyboard"), and to size the on-screen piano.

## Rough approach

- Pure core: a `KeyboardRange` (lowest / highest MIDI note) and helpers to build it from a key count or from two notes. No React / DOM imports.
- Calibration reads `noteon` from the existing note bus, so it works with any source; the computer keyboard and touch have a fixed range and skip it.
- Fits naturally next to the MIDI device picker (see the Phase 2 items in the roadmap Backlog).

## Open questions

- Where do 25 / 37 / 49-key layouts start (usually C, but not always)? Calibration avoids guessing; a manual key count needs a default lowest key.
- Guessing from the device name (lookup table of known models) as a hint only, or skip it?
- Behaviour when a lesson needs notes outside the range: transpose, skip, or block?
