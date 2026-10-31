# Requirements — Piano sound from real samples

## Context

Roadmap Phase 17, taken from the Backlog item "A better piano sound": during Phase 16 the user said the synth sounds "plastic". Today every note is one triangle wave plus one sine an octave up, with a flat sustain level (`src/audio/synth.ts`). The Backlog offered richer synthesis or real samples; the user chose **real piano samples**.

Only a few free piano sample sets are public domain on their own source page (checked 2026-10-31):

- **FreePats Upright Piano KW** (a Kawai upright, recorded by Gonzalo and Roberto, version 2022-02-21): "Published under the terms of the Creative Commons CC0 1.0 public domain dedication." on https://freepats.zenvoid.org/Piano/acoustic-grand-piano.html. Two velocity layers; SFZ+FLAC 32 MiB.
- Splendid Grand Piano (Akai): "released as public domain in early 2000 by Akai company" per the sfzinstruments README only, so the claim is second-hand. Not chosen.
- Salamander, YDP, and other popular sets are CC-BY, CC-BY-SA, or custom licences. Not allowed.

This phase changes a tech-stack rule: the Audio row says "Web Audio API (small in-house synth …) — No sample downloads". It becomes "Web Audio sample playback of a CC0 piano". `specs/tech-stack.md` is updated first, before the code (see `plan.md`, group 1).

## Functional requirements

- **FR-1** Every note from every source (MIDI, computer keyboard, on-screen piano, Player playback) must sound with recorded piano samples from the FreePats Upright Piano KW set. The old oscillator sound is removed; there is no setting to bring it back.
- **FR-2** All 88 keys (A0–C8) must sound at their correct pitch. Keys without their own sample play the nearest sampled key, shifted in pitch (at most 2 semitones away).
- **FR-3** Velocity must change the sound: both velocity layers of the source are used (soft keys play the soft layer, hard keys the loud layer), and loudness also follows velocity within a layer. The computer keyboard and the on-screen piano (velocity 90) and Player playback keep their current velocities.
- **FR-4** A held note must fade like a real piano: it decays naturally to silence even while the key is held. Low notes ring longer than high notes. Releasing a key (with the pedal up) stops the note with a short damper fade (about 0.1–0.3 s), with no click.
- **FR-5** The sustain pedal must keep working as today (released notes ring on while the pedal is down and stop when it is lifted). Repeating a note restarts it. Polyphony must be at least 32 notes. When the limit is reached, the oldest note is stopped with a short fade, not cut off.
- **FR-6** A light room reverb must be applied to the piano. A **Reverb** on/off toggle next to the volume control turns it on and off. The choice is saved on the device (default: on) and applies at once, also to notes that are already sounding. The reverb is generated in code; no impulse-response file is downloaded.
- **FR-7** The samples must be part of the app's offline files: the service worker precaches them with the rest of the build, so the piano sounds offline after the first visit. They are served from the app's own static files (no external host).
- **FR-8** The samples must start loading when the app starts, without waiting for a key press. Until they are decoded, keys make **no sound** (the user's decision). Everything else works as usual: judging, highlights, and lessons don't wait for the sound. While loading, a short "Loading piano sound…" text is shown next to the volume control. If loading fails, the text says the piano sound could not be loaded and offers **Retry**.
- **FR-9** Volume and mute must work as today (same saved settings), for the piano and the reverb together.
- **FR-10** The source, licence (CC0 1.0, with the verbatim sentence), version, and check date of the samples must be recorded in `licenses/piano-samples.md`. A test must check that every sample in the sample map exists, that the total download size stays within budget (≤ 20 MB), and that the licence record names CC0.
- **FR-11** The licence must be re-checked by reading the source page again (not from a summary) before the samples are committed. The verbatim CC0 sentence and the check date in `licenses/piano-samples.md` come from that reading. If the page no longer says CC0, the work stops and the spec is revised.
- **FR-12** `licenses/piano-samples.md` must also record: that CC0 waives copyright but not patent or trademark rights; that the samples are modified (trimmed, cut, fades, MP3) and the modified files are shared under the same CC0 terms; and the tools used (ffmpeg, a developer tool only; nothing of it is shipped).
- **FR-13** The Kawai brand is a trademark of its owner. It may appear only as a plain fact in the credits ("recorded from a Kawai upright piano", as the source says): in `licenses/piano-samples.md` and the README credits. It must not appear in the UI, the manifest, or the app name, and nothing may suggest that Kawai made or endorses the app.
- **FR-14** The README credits (all four languages) must name the set, the recorders, the source link, and the CC0 licence. This is courtesy, not required by CC0.

## Non-functional requirements

- User-facing text goes through the translations module (English default; add keys for `uk`, `de`, `fr` too). New strings: Reverb toggle, loading text, load-failed text, Retry.
- Works with the on-screen and computer keyboard (no MIDI device required).
- **Latency:** no perceptible added input latency. A note starts within one audio render quantum of the event. Leading silence of each sample, including encoder padding, is skipped so the attack is not delayed.
- **Download size:** the sample files total 10–20 MB (the user's budget), compressed audio that Chromium decodes with `decodeAudioData`.
- **Memory:** decoded sample buffers stay within about 128 MB. The build script reports the decoded size, and the app must stay responsive on a mid-range Android phone.
- Pure core: choosing a sample for a note and velocity, the gain curve, the release time, and the reverb impulse are pure functions in `src/core/` with unit tests. Web Audio code stays in `src/audio/`.
- One note pipeline: the sampler subscribes to the note bus exactly as the synth did (through `heldNotes`).
- No new runtime dependencies.

## Rights and patents

Not legal advice; the project is non-commercial and this is the level of care the library already uses.

- **Copyright:** CC0 1.0 on the source page puts the recordings in the public domain; no attribution or share-alike is required. "Public domain" is the publisher's declaration, not a legal guarantee (same caveat as the library).
- **Patents:** CC0 does not waive patent or trademark rights, but recordings of a sound are not patentable, so nothing applies to the samples. MP3 patents expired in 2017, and the browser decodes the files, so the app licenses nothing. ffmpeg (LGPL / GPL) runs once on the developer's machine; its licence does not extend to the output files and nothing of it is bundled.
- **Trademarks:** see FR-13.
- The reverb is a generated noise impulse with the standard Web Audio `ConvolverNode`; no third-party algorithm or file is used.

## Out of scope

- A choice between pianos (grand / upright) or keeping the old synth sound.
- Sympathetic string resonance, pedal noise, release ("key-up") samples, and the undamped top octaves of a real piano.
- Half-pedalling (the pedal stays on/off).
- Loading only part of the samples first (for example the middle octaves) or lazy decoding per register.
- A reverb amount slider or room types.
- Samples in Safari as a target (Safari is not a target browser; it gets whatever its decoder supports).
- The Splendid Grand Piano or any CC-BY set.

## Decisions

| Question                                     | Decision                                                                                               | Reason                                                                                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Richer synthesis or real samples?            | Real piano samples                                                                                     | User choice.                                                                                                                    |
| Which sample set?                            | FreePats Upright Piano KW (CC0 1.0)                                                                    | User choice. It is the only set with an explicit CC0 statement on its own source page; it matches the library's licence policy. |
| Keep the old synth sound?                    | No, it is replaced                                                                                     | User choice. One sound, no setting.                                                                                             |
| Held notes                                   | Fade to silence like a real piano; a damper fade on release                                            | User choice.                                                                                                                    |
| Reverb                                       | Light generated reverb with an on/off toggle next to the volume (saved, default on)                    | User choice.                                                                                                                    |
| Download size                                | About 10–20 MB                                                                                         | User choice: more keys, both layers, longer tails.                                                                              |
| When to download                             | Precached with the app; works offline after the first visit                                            | User choice.                                                                                                                    |
| Sound before the samples are ready / on fail | Silence (no synth fallback)                                                                            | User choice. A short loading / failed text with Retry was added so the silence is explained.                                    |
| Licence policy for samples                   | Only CC0 or public domain stated on the source's own page, recorded in `licenses/`, enforced by a test | Same rule as the library (Mutopia / Commons).                                                                                   |
