# Plan — Input pipeline & on-screen keyboard

> Roadmap phase: Phase 2 — Input pipeline & on-screen keyboard
> Branch: `feature/input-pipeline-keyboard`
> Status: Implemented

## Goal

The learner can play the app like an instrument: a MIDI keyboard, the computer keyboard, or the on-screen piano all make sound and light up the keys on screen. Every press goes through one note pipeline that Phase 3's lesson judge will subscribe to.

## Approach

Three layers, so the core stays pure (rules 1–3 in `tech-stack.md`):

**Localized note names — `src/i18n/noteNames.ts`** (pure, next to the translations module): `NOTE_NAMES: Record<Locale, readonly string[]>` (12 pitch classes per language: letters for `en`, letters with H for `de`, до-ре-мі for `uk`, do-ré-mi for `fr`; black keys use ♯), `noteNameFor(locale, note)` and `noteLabelFor(locale, note)` (name + octave number). Components get the locale from `useLocale()`. `core/notes.ts` stays language-free.

**Pure core — `src/core/`** (no React, DOM, or Web Audio imports; unit-tested)

- `types.ts`: the shared types (rule 4). `NoteSource = 'midi' | 'computer' | 'screen'`. `NoteEvent` is a discriminated union: `{ type: 'noteon'; note; velocity; source }`, `{ type: 'noteoff'; note; source }`, `{ type: 'sustain'; on; source }`.
- `notes.ts`: note-number helpers: `isBlackKey(n)`, `pitchClass(n)`, `octaveOf(n)` (C4 = 60), `keyboardRange(baseOctave)` (25 notes: base C → base C + 24), octave limits.
- `midi.ts`: `parseMidiMessage(data: Uint8Array): NoteEvent | null` (FR-2). It sets `source: 'midi'`. Status byte masked with `0xF0`, so all channels are accepted. Short or unknown messages → `null`.
- `computerKeymap.ts`: `KEY_OFFSETS: Record<code, semitones>` (`KeyA` → 0, `KeyW` → 1, … `Semicolon` → 16), `OCTAVE_DOWN_CODE = 'KeyZ'`, `OCTAVE_UP_CODE = 'KeyX'`, `noteForCode(code, baseOctave)`, `shiftOctave(base, delta)` (clamped to C1–C6), `QWERTY_LABELS` as the fallback labels.
- `heldNotes.ts`: pure bookkeeping, used by both the highlight and the synth:
  - which sources hold each note (a key stays lit while any source holds it, FR-8);
  - the sustain state: `apply(state, event) → { state, actions }`, where actions are `start(note, velocity)` / `stop(note)`. A `noteoff` while the pedal is down marks the note as sustained instead of stopping it. Pedal up stops every sustained note that is not held. A `noteon` for a note that is already sounding returns `stop` then `start` (restart, FR-10).
  - `releaseSource(state, source)` returns `noteoff` events for every note that source still holds (used on window blur and device unplug).

**Pipeline and input adapters — `src/input/`** (browser APIs, no React except the hooks)

- `noteBus.ts`: `createNoteBus()` → `{ emit(event), subscribe(listener) → unsubscribe }`. A synchronous pub/sub: listeners run in the same call as `emit`, so the synth starts the sound with no added delay. Unit-tested.
- `computerKeyboard.ts`: `attachComputerKeyboard(bus, getBaseOctave, onOctaveChange) → detach`. `keydown` / `keyup` on `window`. It ignores `event.repeat`, Ctrl / Alt / Meta, and events whose target is an `input`, `select`, `textarea`, or `contenteditable`. It tracks the codes it pressed, so a key released after an octave shift stops the note it actually started. On `blur` it releases everything it holds.
- `midiAccess.ts`: `getMidiSupport()` → `'unsupported' | 'insecure' | 'available'` (checks `window.isSecureContext` and `navigator.requestMIDIAccess`). `connectMidi(bus, onStatus) → disconnect` calls `requestMIDIAccess({ sysex: false })`, attaches `onmidimessage` to every input, listens to `statechange` for hot-plug, and releases the held notes of an unplugged device (it tracks notes per input id). Status values: `connecting`, `connected(deviceNames)`, `no-devices`, `denied`.
- `keyboardLabels.ts`: `loadKeyLabels()` → a promise of `code → label` from `navigator.keyboard.getLayoutMap()` when it exists, else `QWERTY_LABELS`.
- `NoteInputProvider.tsx` + `context.ts`: one bus instance per app, plus the shared base octave, in React context. Hooks: `useNoteBus()`, `useBaseOctave()`, `useHeldNotes()` (subscribes to the bus, keeps a `Set<number>` of lit notes in state using `heldNotes.ts`).

**Audio — `src/audio/`**

- `synth.ts`: `createSynth(bus)`. It creates the `AudioContext` lazily and exposes `resume()`, which the app calls on the first `pointerdown` / `keydown` and from the Connect MIDI button. Each voice is a triangle oscillator plus a sine one octave up, into a `GainNode` envelope (attack ≈ 5 ms, decay to a sustain level, release ≈ 150 ms using `setTargetAtTime`). Velocity sets the peak gain on a squared curve (`(v / 127)²`), so soft notes are clearly quieter. The voices go into a master `GainNode` for volume and mute. The synth runs `heldNotes.apply` on every bus event and plays the returned actions. At most 16 voices; when a 17th starts, the oldest is stopped.
- `settings.ts`: `loadVolume()` / `saveVolume()` / `loadMuted()` / `saveMuted()`, each in try/catch (same pattern as `src/i18n/storage.ts`).

**UI — `src/components/`** (thin: render state, forward events)

- `PianoKeyboard.tsx`: 25 keys from `keyboardRange(baseOctave)`. White keys are flex items; black keys are absolutely positioned over them, so the keyboard scales to 100 % width (360 px gives ≈ 24 px white keys). It uses pointer events (`pointerdown` → `noteon`, `pointerup` / `pointercancel` / `pointerleave` → `noteoff`), tracks notes per `pointerId` for multi-touch, and sets `touch-action: none`. It shows lit keys from `useHeldNotes()` and the labels from FR-9.
- `MidiStatus.tsx`: the Connect button and status text for each FR-3 state; device names are listed next to the translated "Connected:" label.
- `VolumeControl.tsx`: a native range input (0–100) and a mute toggle button with accessible labels.
- `OctaveControl.tsx`: octave down / up buttons (disabled at the limits) and the range text (e.g. "C3–C5").
- `App.tsx`: wraps the screen in `NoteInputProvider` and lays out the free-play screen (FR-13). The `comingSoon` string is replaced by a play hint.

## Task groups

1. **Pure core and tests**
   - [x] `src/core/types.ts`, `notes.ts`, `midi.ts`, `computerKeymap.ts`, `heldNotes.ts` as in Approach
   - [x] `notes.test.ts`: black/white keys, names, C4 = 60, the 25-note range for C3 (48–72), octave limits
   - [x] `midi.test.ts`: note on/off on several channels, note on with velocity 0, CC64 on/off at the 63/64 boundary, other CCs, pitch bend, clock (`0xF8`), SysEx, empty and short messages → `null`
   - [x] `computerKeymap.test.ts`: every mapped code at base C3, octave shift and clamping at C1 / C6, unmapped codes → `null`
   - [x] `heldNotes.test.ts`: two sources holding one note, release by source, sustain holds released notes, pedal up stops only notes that are not held, restart of a sounding note
   - [x] Remove `src/sample.test.ts` (real tests replace it)
2. **Note pipeline and input adapters**
   - [x] `src/input/noteBus.ts` + `noteBus.test.ts` (listeners called synchronously in order, unsubscribe works, a throwing listener does not block the others)
   - [x] `src/input/computerKeyboard.ts` (repeat, modifiers, form-control focus, octave keys, release on blur)
   - [x] `src/input/midiAccess.ts` (support check, connect, all inputs, hot-plug, release on unplug, denied)
   - [x] `src/input/keyboardLabels.ts`
   - [x] Localized note names (added after review): `src/i18n/noteNames.ts` + `noteNames.test.ts`; `PianoKeyboard` and `OctaveControl` use `noteNameFor` / `noteLabelFor`; `noteName` / `noteLabel` leave `core/notes.ts`
   - [x] `src/input/NoteInputProvider.tsx` + `context.ts` with `useNoteBus`, `useBaseOctave`, `useHeldNotes`
3. **Synth and volume**
   - [x] `src/audio/synth.ts`: lazy `AudioContext`, `resume()`, voices with envelope and velocity curve, sustain via `heldNotes`, 16-voice limit, master gain
   - [x] `src/audio/settings.ts`: volume and mute load/save with try/catch, defaults 80 % / unmuted
   - [ ] Verify by hand: computer keys play sound; a fast repeated note and an eight-note chord sound clean (no clicks)
4. **Free-play screen and translations**
   - [x] `PianoKeyboard.tsx`, `MidiStatus.tsx`, `VolumeControl.tsx`, `OctaveControl.tsx`
   - [x] `App.tsx`: free-play layout, provider, audio resume on first gesture
   - [x] New keys in `locales/en.ts` (play hint, Connect MIDI button, each MIDI status, "Connected:", volume, mute / unmute, octave down / up, keyboard aria label), then `uk.ts`, `de.ts`, `fr.ts`; remove `comingSoon` from all four
   - [ ] Verify by hand: 360 px width, multi-touch in DevTools device mode, highlight from every source
5. **Docs and validation**
   - [x] `README.md`: how to play (MIDI connect, computer-key layout, octave keys), Chromium / HTTPS note for MIDI
   - [ ] Run every item in `validation.md`; ask the user to skim the new `uk` / `de` / `fr` strings

## Files touched

| File                                                                        | Change                                 |
| --------------------------------------------------------------------------- | -------------------------------------- |
| `src/core/{types,notes,midi,computerKeymap,heldNotes}.ts`                   | new (pure)                             |
| `src/core/{notes,midi,computerKeymap,heldNotes}.test.ts`                    | new                                    |
| `src/input/{noteBus,computerKeyboard,midiAccess,keyboardLabels,context}.ts` | new                                    |
| `src/input/NoteInputProvider.tsx`, `src/input/noteBus.test.ts`              | new                                    |
| `src/audio/{synth,settings}.ts`                                             | new                                    |
| `src/components/{PianoKeyboard,MidiStatus,VolumeControl,OctaveControl}.tsx` | new                                    |
| `src/App.tsx`                                                               | free-play screen                       |
| `src/i18n/locales/{en,uk,de,fr}.ts`                                         | new keys; `comingSoon` removed         |
| `src/sample.test.ts`                                                        | removed                                |
| `README.md`                                                                 | how to play                            |
| `specs/roadmap.md`                                                          | Phase 2 in progress, link to this spec |

## New dependencies

None. Web MIDI, Web Audio, the Keyboard Map API, and pointer events are browser APIs. If TypeScript's DOM types lack `navigator.keyboard` (the Keyboard Map API is Chromium-only), add a small local type declaration rather than a package.

## Risks & open questions

- **Autoplay policy:** a MIDI message is not a user gesture, so it can't start the `AudioContext`. In practice the learner clicks Connect first, which resumes audio. If MIDI notes arrive while the context is still suspended, the synth calls `resume()` and the first notes may be silent. This is acceptable for this phase.
- **Keyboard Map API** exists only in Chromium and in secure contexts. Elsewhere the labels fall back to QWERTY, which is wrong on AZERTY / QWERTZ, but playing still works because mapping uses physical codes.
- **`;` key position:** `Semicolon` is the key right of `L` on all three layouts, but its printed label differs (`ö` on QWERTZ, `m` on AZERTY). The layout map covers this.
- **Pointer leave on touch:** with `touch-action: none` and no pointer capture, sliding a finger off a key fires `pointerleave` and releases the note. Sliding onto the next key does not start it (no glissando). This keeps the code simple; glissando can be a later idea.
- **Note naming** is letter-based in every locale (see Decisions). The user should confirm this during review.
- **Locale strings** for `uk`, `de`, `fr` are written by the agent; the user skims them during validation.
