# Real-device MIDI check

Left open in Phase 2 (`specs/2026-10-25-input-pipeline-keyboard/validation.md`, FR-3 / FR-4 and FR-11).

## Problem

During Phase 2 validation the user could not get their digital piano connected (not visible to the PC, and a phone needs an HTTPS page for Web MIDI). So `src/input/midiAccess.ts` has never run against a real device: `requestMIDIAccess`, listening to all inputs, hot-plug, releasing notes on unplug, and the sustain pedal. Message parsing (`core/midi.ts`) and pedal bookkeeping (`core/heldNotes.ts`) are unit-tested.

## Idea

Run the open checks from the Phase 2 `validation.md` once a device connects:

- **Desktop, now:** a virtual device (loopMIDI + VMPK on Windows) covers connect, hot-plug (close/reopen the port), velocity, and CC64 from VMPK.
- **Phone, Phase 3 (deployment):** after deploying over HTTPS, Android Chrome with a USB-OTG keyboard. Before that, `chrome://flags` → "Insecure origins treated as secure" with the PC's LAN address works for a quick test.

## Open questions

- Why the piano was not detected by the PC: driver, cable without data lines, USB mode in the piano's menu, or a port held by another app. Check the piano model's manual.
- Do some keyboards send the pedal as something other than CC64, or send half-pedal values? Only CC64 (≥ 64 = on) is handled today.
