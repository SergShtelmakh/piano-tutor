# Requirements — Input pipeline & on-screen keyboard

## Context

Roadmap Phase 2. Phase 1 delivered a translated app shell with a placeholder screen and no input. This phase adds the foundation that every later phase builds on: one note-event pipeline (architecture rule 1 in `tech-stack.md`) fed by a MIDI keyboard, the computer keyboard, and an on-screen piano, plus a small Web Audio synth so every key press makes a sound. The placeholder screen becomes a free-play screen.

Phase 3 (first lesson) will subscribe its judge to the same pipeline, so the event shape defined here is the contract for later phases.

The answers to the planning questions are in the **Decisions** table below. None of them change `tech-stack.md`.

## Functional requirements

- **FR-1** All input sources (MIDI, computer keyboard, on-screen keyboard) must emit the same note events into one pipeline entry point. Events are `noteon` (note number 0–127, velocity 1–127), `noteoff` (note number), and `sustain` (on/off), each tagged with its source. Sound and the on-screen key highlight subscribe to the pipeline; nothing else reads a device directly. Event types live in one shared types module.
- **FR-2** MIDI messages must be parsed by a pure, unit-tested function:
  - Note On with velocity > 0 → `noteon`; Note Off, or Note On with velocity 0 → `noteoff`.
  - Control Change 64 → `sustain` (value ≥ 64 = on, < 64 = off).
  - All MIDI channels are accepted. Every other message (other CCs, pitch bend, clock, active sensing, SysEx, malformed or short messages) is ignored without errors.
- **FR-3** The app must not ask for MIDI permission on page load. A **Connect MIDI keyboard** button requests access (without SysEx). After that, a status area shows exactly one of:
  - _connected_: the names of all connected input devices; notes from **all** of them feed the pipeline;
  - _no devices_: access granted, but no input is connected;
  - _denied_: the user or browser refused access, with a hint to allow MIDI in the site settings;
  - _unsupported_: the browser has no Web MIDI (e.g. Firefox, Safari), with a hint to use Chrome or Edge or play with the on-screen/computer keyboard. This state is shown instead of the button, without the user clicking anything;
  - _insecure_: the page is not in a secure context (not HTTPS / localhost), shown instead of the button.
- **FR-4** Plugging in or unplugging a MIDI device after connecting must update the device list and start or stop listening to that device, without a reload. Notes held on a device that is unplugged must be released (no stuck notes).
- **FR-5** The computer keyboard must play notes with a DAW-style layout, matched by physical key position (`KeyboardEvent.code`), so it works the same on QWERTY, QWERTZ, and AZERTY:
  - White keys: `A S D F G H J K L ;` → C D E F G A B C D E.
  - Black keys: `W E T Y U O P` → C♯ D♯ F♯ G♯ A♯ C♯ D♯.
  - `Z` shifts one octave down, `X` one octave up. The base octave (the note under `A`) defaults to **C3** and is limited to C1–C6.
  - Notes use a fixed velocity. Key auto-repeat does not retrigger notes. Keys pressed together with Ctrl, Alt, or Meta are ignored, and so are keys typed while focus is in a form control (e.g. the language selector).
  - When the window loses focus, all notes held on the computer keyboard are released.
- **FR-6** The on-screen piano must show two octaves plus the top C (25 keys). By default that is **C3–C5**, with middle C (C4) in the middle. The shown range follows the computer-keyboard base octave (base octave → base octave + 2). On-screen **octave down / up** buttons change the same base octave, so touch users can reach the full range. The current range is shown as text (e.g. "C3–C5").
- **FR-7** The on-screen keys must play notes with mouse, pen, and touch (pointer events, fixed velocity). Several fingers can hold several keys at once. A note is released when its pointer is lifted, cancelled, or leaves the key. The keyboard must fit a 360 px wide screen without horizontal page scroll.
- **FR-8** On-screen keys must light up while they are held, from any source (MIDI, computer keyboard, pointer). A key stays lit while at least one source holds it. A key held only by the sustain pedal is not lit. MIDI notes outside the shown range still sound but are not drawn.
- **FR-9** On-screen keys must show labels:
  - every white key shows its note name in the current language's convention (see below); C keys also show the octave number (C3, C4, C5 in `en` / `de`; до3, до4, до5 in `uk`; do3, do4, do5 in `fr`). The same names are used in the key's accessible label and in the range text next to the octave buttons (FR-6);
  - note names by language: `en` C D E F G A B; `de` C D E F G A **H**; `uk` до ре мі фа соль ля сі; `fr` do ré mi fa sol la si. Black keys add ♯ to the name of the white key below (`C♯`, `до♯`, `A♯` in `de`). Octave numbers are scientific everywhere (C4 / до4 = middle C);
  - keys mapped to the computer keyboard show that key's label. The label comes from the Keyboard Map API (`navigator.keyboard.getLayoutMap()`) when available, so it matches the user's physical layout, and falls back to the QWERTY letters otherwise.
- **FR-10** A Web Audio synth must play every `noteon` and stop every `noteoff` from the pipeline:
  - polyphonic (at least 16 voices; when the limit is reached the oldest voice is stopped);
  - louder with higher velocity;
  - a short attack and release envelope, so notes start and stop without clicks;
  - pressing a note that is already sounding restarts it.
    The audio context is started or resumed on the first user gesture (click, tap, key press, including the Connect MIDI button), as browsers require.
- **FR-11** The synth must honour the sustain pedal: while it is down, released notes keep sounding; when it goes up, all notes that are no longer held are released. The held / sustained bookkeeping is a pure, unit-tested module with no Web Audio imports.
- **FR-12** A volume slider and a mute toggle must control the overall synth volume. Both are saved to `localStorage` (wrapped in try/catch), restored on reload, and default to 80 % / unmuted. The app still works when storage is unavailable.
- **FR-13** The placeholder screen must become a free-play screen: app name, a short hint on how to play (MIDI keyboard, on-screen piano, or computer keyboard), the MIDI status area, volume and octave controls, and the on-screen piano. The language selector stays in the header. The screen must be usable at 360 px width.

## Non-functional requirements

- All user-facing text goes through the translations module, with keys in `en`, `uk`, `de`, and `fr`. Translations do not have interpolation yet (Phase 3), so device names are shown next to a translated label, not inside a translated sentence.
- Works fully without a MIDI device (computer keyboard and on-screen piano).
- No perceptible added input latency: the synth subscribes to the pipeline directly and starts the sound in the same event callback, not after a React render.
- Pure core modules (note helpers, MIDI parsing, key mapping, held/sustained bookkeeping) have no React, DOM, or Web Audio imports, and have unit tests.
- No stuck notes: every way a note can start has a matching way it ends (key up, window blur, pointer up / cancel / leave, device unplugged).
- No new runtime dependencies.

## Out of scope

- Lessons, target notes, judging, right/wrong colours (Phase 3).
- Choosing one MIDI device out of several; MIDI output; SysEx.
- Sample-based or multi-timbre sounds, reverb, other effects.
- Pitch bend, modulation, soft / sostenuto pedals, and other controllers.
- A sustain control for computer or on-screen keyboard (only the MIDI pedal sustains).
- Velocity from computer or on-screen keys (fixed velocity only).
- Settings to hide labels, remap computer keys, or change the shown range size.
- A setting to choose the note-name convention independently of the language (e.g. letters in `uk`); see Decisions.
- Component or end-to-end tests (still in the tooling backlog).

## Decisions

| Question                  | Decision                                                                                                                                                                                            | Reason                                                                                                                                                                                |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MIDI connection           | **Button, then all inputs.** A Connect button asks for permission; every connected input feeds the pipeline; the status lists device names and updates on hot-plug.                                 | User choice. No surprise permission prompt on load; most learners have one keyboard, so no device picker is needed.                                                                   |
| Computer-keyboard layout  | **DAW-style one row**: `A`–`;` white keys, `W E T Y U O P` black keys, `Z` / `X` octave shift. Matched by physical position (`KeyboardEvent.code`).                                                 | User choice. Familiar from Ableton / FL. Physical codes keep the shape of a piano on QWERTZ and AZERTY keyboards (relevant for `de` / `fr` users).                                    |
| On-screen range           | **Two octaves + top C, C3–C5 by default**, following the computer-keyboard octave shift; on-screen octave buttons for touch.                                                                        | User choice. Usable key size on a phone; middle C sits in the middle.                                                                                                                 |
| Default base octave       | **C3** under `A` (computer keys cover C3–E4, the left part of the shown range).                                                                                                                     | Keeps the computer-key range inside the shown range, so every mapped key is visible and labelled.                                                                                     |
| Extras in this phase      | **All four**: sustain pedal (CC64), volume + mute, pressed-key highlight, note-name and computer-key labels.                                                                                        | User choice.                                                                                                                                                                          |
| Volume persistence        | Volume and mute are saved in `localStorage` (`piano-tutor.volume`, `piano-tutor.muted`).                                                                                                            | A learner expects their volume to stay the same after a reload. Same pattern as the saved language.                                                                                   |
| Note-name convention      | **Follows the language** (changed after the first review): `en` letters, `de` letters with H, `uk` до-ре-мі, `fr` do-ré-mi; scientific octave numbers everywhere (C4 = middle C), ♯ for black keys. | Learners in `uk` / `fr` are taught solfège, and `de` learners H. The first draft used letters everywhere; the user asked for the localized names. A separate setting is out of scope. |
| Key highlight vs. sustain | A key is lit only while physically held, not while it rings on the pedal.                                                                                                                           | Shows what the learner is pressing, which is what Phase 3 will judge.                                                                                                                 |
