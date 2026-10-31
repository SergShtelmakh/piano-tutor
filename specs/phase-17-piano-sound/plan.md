# Plan — Piano sound from real samples

> Roadmap phase: Phase 17 — Piano sound from real samples
> Branch: `feature/piano-sound`
> Status: Implemented (automated gates pass; listening and device checks open)

## Goal

Every key sounds like a real piano: recorded samples of a CC0 upright (FreePats Upright Piano KW) replace the oscillator synth. Notes respond to velocity, decay naturally, stop with a damper fade, and get a light room reverb that can be switched off. The samples are precached, so the piano also sounds offline.

## Approach

- **Constitution first (`specs/tech-stack.md`)**: the Audio row changes from "small in-house synth … no sample downloads" to "sample playback of a CC0 piano (FreePats Upright Piano KW), precached; reverb generated in code". The project layout gets a new paragraph, and a **sample licence policy** is added next to the library policy: only CC0 or public domain stated on the source's own page, recorded in `licenses/`, enforced by a test.
- **Sample preparation (dev only, `scripts/build-piano-samples.ts`)**: run once with Bun on the extracted `UprightPianoKW-SFZ+FLAC-20220221` folder. It reads the SFZ regions (root key, key range, velocity range, file), keeps both velocity layers and the source's sampled keys, trims leading silence, cuts each tail to a length by register (long in the bass, short in the treble) with a fade-out, and encodes with **ffmpeg** (a tool on the developer's PATH, not a package dependency) to **MP3**, 44.1 kHz stereo. It writes the files to `public/piano/` and the sample map to `src/core/pianoSampleMap.ts` (generated, pure data: `{ file, root, lowKey, highKey, lowVelocity, highVelocity }[]`). It also prints the total file size and the decoded size, so the 10–20 MB and ~128 MB budgets can be tuned (bitrate, tail lengths, mono) before the files are committed. The outputs are committed; CI and other developers never run the script.
- **Pure core (`src/core/pianoSamples.ts`)**:
  - `pickSample(map, note, velocity)` → `{ sample, playbackRate, gain }`. It chooses the region whose key and velocity ranges contain the note, or the nearest root in the right layer. `playbackRate` is `2^((note − root) / 12)`. `gain` follows velocity within the layer (a curve that makes the soft/loud layer boundary smooth).
  - `releaseTime(note)`: the damper fade, a little longer in the bass (about 0.1–0.3 s).
  - `onsetIndex(channel, threshold)`: the first sample above a threshold, so decoder padding and leading silence are skipped at load time.
  - `impulseResponse(seconds, sampleRate, random)`: a stereo decaying-noise room impulse (about 1.5 s, gentle high cut over time), with an injectable random source like `lessons.ts`.
  - Validity checks used by tests: every key A0–C8 has a sample within 2 semitones in each layer, and the velocity ranges cover 1–127 with no overlap.
- **Audio engine (`src/audio/`)**: `synth.ts` keeps its role and the `Synth` interface (`resume`, `setVolume`, `setMuted`) and gains `setReverb(on)` and a load status (`loading` / `ready` / `failed`, with `retry()` and a subscribe function for the UI). Inside:
  - `sampleLoader.ts` fetches `public/piano/*.mp3` under `import.meta.env.BASE_URL` at app start and decodes them in an `AudioContext` created at once. A suspended context can decode, and `resume()` still happens on the first gesture. It stores each buffer with its onset offset. One failed file means `failed`; `retry()` loads the missing files again.
  - A voice is an `AudioBufferSourceNode` (`playbackRate`, `start(now, onset)`) into its own gain node. The sample's own decay is the "fade while held" (FR-4); no loop. A stop ramps the gain to 0 over `releaseTime` and stops the source after it. Up to 32 voices; the oldest is faded out when the limit is reached. While status ≠ `ready`, `start` actions are ignored (FR-8).
  - Graph: voices → dry gain and → `ConvolverNode` (generated impulse) → wet gain; both → master gain (volume / mute, as today) → compressor → destination. The reverb toggle ramps the wet gain (about 50 ms), so it applies to sounding notes too.
  - `settings.ts` gains `loadReverb` / `saveReverb` (`piano-tutor.reverb`, default on, try/catch).
  - The note-bus subscription through `heldNotes.apply` is unchanged (pedal, repeats, multiple sources).
- **UI**: `VolumeControl` gets a **Reverb** toggle button (`aria-pressed`, same style as Mute) and a small status text: "Loading piano sound…", or "Piano sound could not be loaded" with **Retry**. New keys in `locales/en.ts`, then `uk`, `de`, `fr`. `useSynth()` stays the access point.
- **Offline (`vite.config.ts`)**: `mp3` is added to `globPatterns`, so the samples are in the precache. Each file stays under Workbox's 2 MB per-file limit (checked by the test). The service worker's precache grows by the sample size.
- **Licence record**: `licenses/piano-samples.md` (source URL, set name and version, recorders, the verbatim CC0 sentence read from the page again before the commit with that day's check date (FR-11), the note that CC0 does not waive patents or trademarks, what was changed: trimmed, cut with fades, encoded to MP3, and ffmpeg as a developer-only tool (FR-12). The Kawai name appears only here and in the README credits (FR-13). `config/pianoSampleFiles.test.ts` (in `config/` for the Node types, like `libraryFiles.test.ts`) checks that every file in the map exists, each is < 2 MB, the total is ≤ 20 MB, and the licence file names CC0 1.0 and the FreePats URL.

## Task groups

1. **Constitution and samples**
   - [x] Update `specs/tech-stack.md`: Audio row, sample licence policy, layout paragraph for `src/audio/` and `public/piano/`; remove "No sample downloads".
   - [x] Download `UprightPianoKW-SFZ+FLAC-20220221.7z` from FreePats, extract it outside the repo, read its SFZ (which keys are sampled, velocity split, loops in the bass).
   - [x] Write `scripts/build-piano-samples.ts`; tune tail lengths, bitrate, and stereo/mono to fit 10–20 MB download and ~128 MB decoded; generate `public/piano/` and `src/core/pianoSampleMap.ts`.
   - [x] Read the FreePats source page again and copy the CC0 sentence from it (FR-11); stop and tell the user if it differs.
   - [x] `licenses/piano-samples.md` (FR-10, FR-12, FR-13); `config/pianoSampleFiles.test.ts`, which also fails if "Kawai" appears in `src/`, `index.html`, or the manifest config (FR-13).
   - [x] README credits in `README.md` and the three translations in the same commit (FR-14).
2. **Pure core**
   - [x] `src/core/pianoSamples.ts`: `pickSample`, `releaseTime`, `onsetIndex`, `impulseResponse`, map checks.
   - [x] Tests: exact root (rate 1), a key between roots (nearest, rate within ±2 semitones), A0 and C8, layer choice at the split and at 1 / 127, gain rises with velocity and is continuous at the split, release longer in the bass, onset after padding / all-silent buffer, impulse decays and is deterministic with a seeded random, the generated map covers A0–C8 in both layers.
3. **Sampler engine**
   - [x] `src/audio/sampleLoader.ts` (fetch + decode at start, onset offsets, status, retry).
   - [x] Rewrite `src/audio/synth.ts` as the sampler (voices, damper fade, 32-voice limit with fade-out, ignore starts until ready, dry/wet reverb chain, `setReverb`, status subscribe); remove the oscillator code.
   - [x] `settings.ts`: `loadReverb` / `saveReverb`; `NoteInputProvider` passes the initial reverb setting and starts loading at mount.
   - [x] `vite.config.ts`: `mp3` in the precache.
4. **UI and translations**
   - [ ] `VolumeControl`: Reverb toggle, loading / failed text with Retry; layout checked at 360 px.
   - [x] Keys in `en`, then `uk`, `de`, `fr`.
5. **Gates and listening**
   - [x] All automated gates.
   - [ ] Listen in `bun run dev` and in `bun run build && bun run preview` (offline): every register, soft / loud, held notes, pedal, fast repeats, big chords with the pedal (no clipping, no clicks), Player playback of a dense library piece.
   - [ ] Check memory and responsiveness on Android Chrome (Cloudflare preview).

## Files touched

| File                                            | Change                                              |
| ----------------------------------------------- | --------------------------------------------------- |
| `specs/tech-stack.md`                           | Audio row, sample licence policy, layout            |
| `scripts/build-piano-samples.ts` (new)          | Dev-only sample preparation (needs ffmpeg on PATH)  |
| `public/piano/*.mp3` (new)                      | The prepared samples (10–20 MB)                     |
| `src/core/pianoSampleMap.ts` (new, generated)   | Sample map data                                     |
| `src/core/pianoSamples.ts`, `.test.ts` (new)    | Sample choice, gain, release, onset, impulse        |
| `src/audio/sampleLoader.ts` (new)               | Fetch and decode, status, retry                     |
| `src/audio/synth.ts`                            | Oscillators replaced by the sampler; reverb; status |
| `src/audio/settings.ts`                         | Reverb setting                                      |
| `src/input/NoteInputProvider.tsx`, `context.ts` | Initial reverb setting, start loading               |
| `src/components/VolumeControl.tsx`              | Reverb toggle, loading / failed text, Retry         |
| `src/i18n/locales/{en,uk,de,fr}.ts`             | New strings                                         |
| `vite.config.ts`                                | Precache `mp3`                                      |
| `licenses/piano-samples.md` (new)               | Source, CC0 sentence, check date, changes           |
| `config/pianoSampleFiles.test.ts` (new)         | Files exist, size limits, licence record            |

The README credits (all four languages, FR-14) are written in group 1; the roadmap and the changelog are updated in the replan step. Add `README.md`, `README.uk.md`, `README.de.md`, and `README.fr.md` to this table when implementing.

## New dependencies

None. ffmpeg is a developer tool used once to prepare the committed files (like `@vite-pwa/assets-generator` for icons, but not installed through the package manager). The script fails with a clear message if it is missing. Install on Windows with `winget install Gyan.FFmpeg`. The `.7z` archive is extracted with 7-Zip or Windows `tar`.

## Risks & open questions

- **Which keys the source sampled** is not stated on the FreePats page. FR-2 (at most 2 semitones of pitch shift) assumes about every minor third or denser. If the set is sparser, the shift limit in FR-2 is updated in the spec before coding.
- **Bass loops**: the page says bass notes contain loops. We don't loop, so a bass sample is used up to its cut length and fades there; check that the cut is long enough.
- **MP3 padding**: the encoder adds silence at the start. `onsetIndex` skips it at load time, whatever the decoder does with the gapless header.
- **Memory on phones**: stereo decoded buffers can be large; the script reports the size, and mono or shorter tails are the fallback.
- **First visit**: the precache now downloads 10–20 MB more on install; on a slow connection the first notes are silent until the samples arrive (user decision), which the loading text explains.
- **Sound character**: it is an upright recorded with a Zoom H1, not a concert grand. If the user dislikes it after listening, a different CC0 / public-domain set means a new spec decision, not a code change.
