# Real-device MIDI check

Left open in Phase 2 (`specs/phase-02-input-pipeline-keyboard/validation.md`, FR-3 / FR-4 and FR-11).

## Problem

During Phase 2 validation the user could not get their digital piano connected (not visible to the PC, and a phone needs an HTTPS page for Web MIDI). So `src/input/midiAccess.ts` has never run against a real device: `requestMIDIAccess`, listening to all inputs, hot-plug, releasing notes on unplug, and the sustain pedal. Message parsing (`core/midi.ts`) and pedal bookkeeping (`core/heldNotes.ts`) are unit-tested.

## Idea

Run the open checks from the Phase 2 `validation.md` once a device connects:

- **Desktop, now:** a virtual device (loopMIDI + VMPK on Windows) covers connect, hot-plug (close/reopen the port), velocity, and CC64 from VMPK.
- **Phone, Phase 3 (deployment):** after deploying over HTTPS, Android Chrome with a USB-OTG keyboard. Before that, `chrome://flags` → "Insecure origins treated as secure" with the PC's LAN address works for a quick test.

## Open questions

- Why the piano was not detected by the PC: driver, cable without data lines, USB mode in the piano's menu, or a port held by another app. Check the piano model's manual.
- Do some keyboards send the pedal as something other than CC64, or send half-pedal values? Only CC64 (≥ 64 = on) is handled today.

## Results (Phase 3, 2026-10-25)

Tested on the Cloudflare preview of `feature/deployment-device-testing` (HTTPS), commit `cf74c0d`, with a **Roland FP-30X** over USB.

| Check                                                              | Desktop (Windows 10, Chrome) | Android (Chrome, USB-OTG) |
| ------------------------------------------------------------------ | ---------------------------- | ------------------------- |
| Connect lists the device                                           | pass                         | pass                      |
| Velocity changes loudness                                          | pass                         | pass                      |
| Unplug removes the device, replug brings it back (no reload)       | pass                         | not tried (removal: pass) |
| Held note released on unplug (no stuck note)                       | pass                         | pass                      |
| Sustain pedal holds a chord until the pedal is released            | pass                         | pass                      |
| Pedal down, one key held, pedal up: only the held key sounds       | pass                         | not tried                 |
| Same note from MIDI and mouse: key lights until both are released  | pass                         | -                         |
| Block permission shows "denied"                                    | pass                         | -                         |
| Allow with no device shows "no devices", device appears on plug-in | pass                         | -                         |

No bugs were found, so no code changed (FR-11). The open questions about CC64 half-pedal values and other pedal messages remain: the FP-30X sends the pedal as CC64 and it works.

**Status: closed for the FP-30X.** Other keyboards may still behave differently.
