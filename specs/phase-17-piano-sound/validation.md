# Validation — Piano sound from real samples

The feature is done (and the branch can be merged) only when every box is checked.

## Automated

- [x] `bun run lint` passes
- [x] `bun run format:check` passes
- [x] `bun run build` passes
- [x] `bun run test` passes: sample choice, layers, gain, release, onset, impulse, and map coverage of A0–C8 have unit tests; `config/pianoSampleFiles.test.ts` checks the files, the size limits (each < 2 MB, total ≤ 20 MB), and the CC0 licence record

## Manual checks

Run `bun run dev`, open http://localhost:3000 in Chrome, use headphones or decent speakers. For the offline checks use `bun run build && bun run preview` (http://localhost:4173).

- [ ] FR-1: Free play with the computer keyboard (`A S D F…`), the on-screen piano, and a MIDI keyboard: every note sounds like a recorded piano; no oscillator sound is left anywhere (lessons, Player).
- [ ] FR-2: Move the on-screen piano to both ends (A0 and C8) and play chromatic runs in every octave: every key has the right pitch (check a few against a tuner or the MIDI keyboard's own sound) and no key sounds clearly different from its neighbours.
- [ ] FR-3: On a MIDI keyboard, play very soft and very hard: soft notes are quieter and darker, hard ones louder and brighter; a slow crescendo has no sudden jump at the layer split.
- [ ] FR-4: Hold a low note and a high note: both fade by themselves while held, the low one rings longer. Release a key: the note stops quickly with no click.
- [ ] FR-5: Hold the pedal and play a melody: notes ring on and stop when the pedal is lifted. Repeat one key fast: each press restarts it. Play big pedalled chords and glissandi: no clipping, no clicks, the oldest notes fade out.
- [ ] FR-6: The Reverb toggle is next to the volume: on gives a light room, off a dry sound; switching while notes ring changes them at once; the choice survives a reload; it is on for a new device (clear site data).
- [ ] FR-7: In `preview`, open the app once, then go offline (DevTools → Network → Offline) and reload: the piano still sounds. The `piano/*.mp3` files are in the service worker's precache.
- [ ] FR-8: With DevTools → Network → Slow 3G and the cache disabled, reload: "Loading piano sound…" shows and keys are silent but still light up and judge in a lesson; the sound starts when loading ends. Block `piano/*.mp3` (DevTools request blocking): the failed text and Retry show; unblock and Retry: the sound works.
- [ ] FR-9: Volume slider and Mute change the piano and the reverb together; both are remembered after a reload.
- [x] FR-10: `licenses/piano-samples.md` names the FreePats Upright Piano KW, its version, recorders, the verbatim CC0 1.0 sentence, the source URL, and the check date; the source page still says CC0.
- [x] FR-11: Read the FreePats source page again yourself: it still says "Published under the terms of the Creative Commons CC0 1.0 public domain dedication." for the Upright Piano KW; the check date in `licenses/piano-samples.md` is the date of that reading.
- [x] FR-12: `licenses/piano-samples.md` states that CC0 does not waive patent or trademark rights, lists the modifications (trimmed, cut with fades, MP3), and names ffmpeg as a developer-only tool.
- [x] FR-13: Search the repo (`src`, `index.html`, `public/`, `vite.config.ts`) for "Kawai": it appears only in `licenses/piano-samples.md` and the README credits, as a plain statement of what was recorded.
- [x] FR-14: The README credits in `README.md`, `README.uk.md`, `README.de.md`, and `README.fr.md` name the set, the recorders, the source link, and CC0; the language switchers still work.
- [ ] Latency: playing fast on the MIDI keyboard and the computer keyboard feels as immediate as before this phase.
- [ ] Player: play a dense library piece (e.g. the Fantaisie-Impromptu) to the end at 150 %: no dropouts, no stuck notes after Stop.
- [ ] Android Chrome (Cloudflare preview): the piano loads, sounds, and the app stays responsive; play with touch and a USB-OTG MIDI keyboard.
- [ ] At 360 px the volume, Mute, Reverb, and the loading text fit without overlap.
- [ ] The user skims the new `uk`, `de`, `fr` strings.
- [ ] No console errors.

## Constitution follow-up

- [ ] `specs/tech-stack.md`: Audio row and sample licence policy updated (done in group 1); known technical debt updated
- [ ] `specs/roadmap.md`: Phase 17 status; the "better piano sound" backlog item removed or narrowed
- [ ] `CHANGELOG.md` / README (all four languages): credits for the samples (`README.md` first, then the three translations in the same commit)
