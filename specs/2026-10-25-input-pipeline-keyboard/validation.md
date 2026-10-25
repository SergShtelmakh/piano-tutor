# Validation — Input pipeline & on-screen keyboard

The feature is done (and the branch can be merged) only when every box is checked.

## Automated

- [ ] `bun run lint` passes
- [ ] `bun run format:check` passes
- [ ] `bun run build` passes
- [ ] `bun run test` passes; `notes`, `midi`, `computerKeymap`, `heldNotes`, and `noteBus` have unit tests
- [ ] CI is green on the PR

## Manual checks

Run `bun run dev` and open http://localhost:3000 in Chrome. Checks marked **(MIDI)** need a MIDI keyboard. Without one, use a virtual MIDI device (e.g. loopMIDI + VMPK on Windows) or mark the check as done by the user.

- [ ] FR-1: Code review: `PianoKeyboard`, `computerKeyboard`, and `midiAccess` only call `bus.emit`; the synth and `useHeldNotes` only call `bus.subscribe`; no other module reads a device. The event types are imported from `src/core/types.ts` only.
- [ ] FR-2: `midi.test.ts` covers note on/off, velocity-0 note on, CC64 at 63/64, other channels, and ignored messages (pitch bend, clock, SysEx, short).
- [ ] FR-3: On page load there is no permission prompt. Click **Connect MIDI keyboard** → Chrome asks for MIDI permission. **Allow** with no device plugged in → the "no devices" message. Reset the permission (site settings), reload, click Connect, **Block** → the "denied" message with the site-settings hint. Open the page in Firefox → the "unsupported" message is shown without clicking, and the on-screen piano still plays. Open it over plain HTTP via the LAN IP (`http://<your-ip>:3000`, e.g. with `bun run dev --host`) → the "insecure" message.
- [ ] FR-3 / FR-4 **(MIDI)**: With permission granted, plug in the keyboard → its name appears without a reload; notes play and light up. Hold a key and unplug the device → the sound stops, the key goes dark, and the device disappears from the list.
- [ ] FR-5: Press `A S D F G H J K L ;` → C3 up to E4; `W E T Y U O P` → the black keys. Hold `A` → one note, no retrigger from auto-repeat. Press `Z` twice → the range drops to C1–C3; press `Z` again → no change. Press `X` until C6–C8; again → no change. Hold `A`, press `X`, release `A` → the note stops. Focus the language selector and type letters → no notes. Press Ctrl+S / Ctrl+A → no notes. Hold `A`, Alt+Tab away → the note stops.
- [ ] FR-6: On load the piano shows C3–C5 (25 keys) and the range text reads "C3–C5". The on-screen octave buttons change the range and the computer-key mapping together; they are disabled at C1 and C6.
- [ ] FR-7: Click keys with the mouse → they play and stop on release. Press and slide off a key → the note stops. In DevTools device mode (360 px, touch), press two keys at once → both sound; lift one → only that one stops. No horizontal page scroll at 360 px.
- [ ] FR-8: Keys light up while held from the computer keyboard, the mouse, and **(MIDI)** the MIDI keyboard. Hold `A` and click C3 with the mouse, release `A` → C3 stays lit until the mouse is released. **(MIDI)** Hold the sustain pedal, play and release a key → it keeps sounding but is not lit. **(MIDI)** Play a note outside the shown range → it sounds and nothing breaks.
- [ ] FR-9: White keys show note names, C keys with the octave (C3, C4, C5). Mapped keys show `A`, `W`, `S`, … With a German or French keyboard layout set in the OS (if available), reload → the labels follow that layout (`Ö`, `Q`/`A`, …).
- [ ] FR-10: Play a quick run and an eight-note chord → clean sound, no clicks or crackles at the start or end of notes. Hold more than 16 notes (e.g. mouse + computer keys + MIDI) → no errors, the oldest note stops. Press the same key fast and repeatedly → each press restarts the note. **(MIDI)** Soft and hard presses → clearly different loudness.
- [ ] FR-11 **(MIDI)**: Press the pedal, play a chord, release the keys → the chord keeps sounding; release the pedal → it stops. Hold one key, release the pedal → only the held key keeps sounding. Covered also by `heldNotes.test.ts`.
- [ ] FR-12: Move the volume slider → loudness changes; mute → silence; unmute → sound returns at the slider level. Reload → volume and mute are kept. First visit (clear site data) → 80 %, unmuted. With site data blocked (DevTools → Application → block cookies / storage for the site) → the app works, and volume and mute still work for the session.
- [ ] FR-13: The free-play screen shows the app name, the play hint, the MIDI status area, volume and octave controls, the piano, and the language selector in the header. Usable at 360 px and on a desktop width.
- [ ] Works with the computer keyboard and on-screen piano without any MIDI device
- [ ] No console errors or warnings during all of the above
- [ ] All new text comes from the translations module, with keys in `en`, `uk`, `de`, and `fr`; switch through all four languages and check that nothing is untranslated or overflows at 360 px. **The user skims the `uk` / `de` / `fr` strings.**

## Constitution follow-up

- [ ] `specs/roadmap.md`: phase status updated
- [ ] `specs/tech-stack.md`: project layout updated (`src/core/`, `src/input/`, `src/audio/`); rules unchanged
- [ ] `CHANGELOG.md` / README updated (user-visible)
