# Roadmap

> Part of the project **constitution**. A living document: **what** we build and **in what order**.
> Each phase becomes one feature spec folder (`specs/phase-NN-<slug>/`) and one branch/PR.
> Keep phases small enough to implement and validate in one session. Re-plan between phases.
>
> Status: `✅ done` · `🔨 in progress` · `📋 planned` · `💡 idea (backlog)`
>
> Phases 1–13 are done; the MVP scope from `mission.md` is covered. Phases 12 (keyboard size) and 13 (MusicXML import) are pending manual validation.

## Phase 1 — Project scaffold & quality gates ✅

Goal: an empty but fully working, tested, deployable skeleton.

Spec: [`specs/phase-01-project-scaffold/`](phase-01-project-scaffold/). Merged in PR #2.

- Vite + React + TypeScript (strict) + Tailwind; Bun scripts `dev`, `build`, `preview`, `lint`, `format`, `format:check`, `test`.
- ESLint + Prettier, Vitest; `.gitignore`.
- GitHub Actions CI running lint, format check, build, and test on every PR and push to `main`.
- In-house translations module with `en` (source, fallback), `uk`, `de`, `fr`; browser-language detection on first visit; a language selector that remembers the choice.
- App shell with a placeholder screen.

## Phase 2 — Input pipeline & on-screen keyboard ✅

Goal: any key press from any source becomes a note event and makes a sound.

Spec: [`specs/phase-02-input-pipeline-keyboard/`](phase-02-input-pipeline-keyboard/). Branch `feature/input-pipeline-keyboard`.

- Single note bus (`src/input/noteBus.ts`): MIDI, computer keyboard, and on-screen piano emit `noteon` / `noteoff` / `sustain`; the synth and the key highlight subscribe.
- Web MIDI behind a Connect button: all inputs, hot-plug, release on unplug, sustain pedal; status for no devices / denied / unsupported / insecure.
- Computer keyboard by physical key (DAW layout `A`–`;`, `W E T Y U O P`, `Z` / `X` octave); labels follow the OS layout via the Keyboard Map API.
- 25-key on-screen piano (C3–C5 by default, octave buttons), multi-touch, pressed-key highlight.
- Note names follow the language: letters (`en`), letters with H (`de`), до-ре-мі (`uk`), do-ré-mi (`fr`). Changed during review.
- Web Audio synth: 16 voices, velocity, envelope, compressor; volume and mute saved locally.
- **Real-device MIDI** was not verified in this phase; it was checked in Phase 3 (see [`backlog/midi-device-check.md`](backlog/midi-device-check.md).

## Phase 3 — Deployment & device testing ✅

Goal: the app is reachable over HTTPS from any device, so it can be tested on phones, tablets, and other computers early. Moved up from the old Phase 6 so every later phase can be checked on real hardware as it ships.

Spec: [`specs/phase-03-deployment-device-testing/`](phase-03-deployment-device-testing/). Branch `feature/deployment-device-testing`.

- Deploy to **both GitHub Pages and Cloudflare Pages** at the same time, so the two can be compared (speed, preview deployments per branch / PR, setup effort, limits) and one chosen afterwards. Web MIDI and, later, the service worker both need HTTPS.
- Deploy pipeline: production build published automatically after CI passes on `main`; per-PR or per-branch previews where the host offers them (Cloudflare Pages does; GitHub Pages does not for free).
- Vite `base` is configurable per target (GitHub Pages serves under `/<repo>/`, Cloudflare Pages from the root), so CI makes one build per host.
- Record both live URLs in `README.md`; confirm each deployed build works with the on-screen and computer keyboard.
- At the end, record the comparison and keep one host (or both, if there is a reason) in `tech-stack.md`.
- Run the real-device MIDI checks left open in Phase 2 on the deployed site (desktop Chrome and Android Chrome with a USB-OTG keyboard), see [`backlog/midi-device-check.md`](backlog/midi-device-check.md).
- Update the hosting row in `tech-stack.md` (confirmed choice) and the privacy note if the host adds analytics.
- **Outcome:** `config/buildInfo.ts` resolves the base path, commit and host from the environment; a footer shows `Build <commit> · <host>`. GitHub Pages deploys from a CI job after `verify` on `main`; Cloudflare deploys through its Git integration with `wrangler.jsonc` (the dashboard created a **Workers** project with static assets, `*.workers.dev`, not a Pages project; it also gives a preview URL per branch).
- **Real-device MIDI verified** on the Cloudflare preview with a Roland FP-30X: desktop Chrome (Windows 10) and Android Chrome over USB-OTG. Connect, velocity, hot-plug, no stuck notes, and the sustain pedal all passed with no code changes. The backlog note is closed.
- **Checked after merge:** both sites serve `main` (GitHub Pages deploy after `verify`, production Cloudflare), and the host comparison is in `hosting-comparison.md`. Decision: keep both, GitHub Pages as production and Cloudflare for per-branch previews.

## Phase 4 — First lesson: play the right notes ✅

Spec: [`specs/phase-04-first-lesson/`](phase-04-first-lesson/). Branch `feature/first-lesson`.

Goal: the core promise of the product, end to end.

- Pure lesson model: a sequence of target notes/chords and a judge that decides right / wrong. The judge subscribes to the Phase 2 note bus (`noteon` events from every source), so lessons work with MIDI, computer keys, and touch alike.
- Lesson text that names notes uses `i18n/noteNames.ts`, so instructions match the key labels in every language.
- One playable lesson screen: target highlighted on the keyboard (green = right, red = wrong), counters for correct notes and mistakes.
- Completion summary with accuracy.
- Unit tests for the judge and lesson progression.
- Translations: add interpolation and plural forms (needed for "3 mistakes", "85 % accuracy"). This was deferred from Phase 1. Ukrainian has several plural forms, so use `Intl.PluralRules`.
- **Outcome (changed during spec review):** the target is shown as a **note on a grand staff** (treble + bass clef), not as a highlighted key, and no note name is shown. The lesson is 20 **random** white-key notes from B3 to C5 (never the same note twice in a row, a new order on every start). `ShiftLeft` plays the B below the base C, so the on-screen piano has 26 keys. Right/wrong flashes colour the played key and the notehead. A **Free play / Lesson** switch lives in app state (no router). Clef shapes are Bravura outlines (SIL OFL 1.1, credited in README). Verified on desktop Chrome and Android Chrome (staff, multi-touch, MIDI keyboard, Sticky Keys with `ShiftLeft`).
- The sheet-music backlog item has started: single notes on a grand staff only. Chords, key signatures, rhythm, and melodies are still open.

## Phase 5 — Game mechanics & local progress ✅

Goal: a reason to come back tomorrow.

Spec: [`specs/phase-05-game-mechanics-local-progress/`](phase-05-game-mechanics-local-progress/). Branch `feature/game-mechanics-local-progress`.

- XP, levels, daily streak; rewards shown on lesson completion.
- Progress saved to `localStorage` (graceful when unavailable).
- Simple progress/home screen with a list of lessons and their stars/best accuracy.
- **Outcome:** a pure progress core (`src/core/progress.ts`): stars (1★ any finish, 2★ ≥ 80 %, 3★ ≥ 95 %), XP = 10 + 5 × stars, level L at 25·L·(L−1) XP, daily streak by local calendar day (no freezes), best values per lesson. Saved as versioned JSON under `piano-tutor.progress`; invalid data means empty progress, and blocked storage falls back to memory with a note. The mode switch became **Home / Free play** (Home is the default, lessons open from a catalog-driven list, `LESSON_CATALOG`). Runs are recorded once from the note listener. Reset progress has an in-page confirmation. Manual validation by the user was still open when this replan was written.

## Phase 6 — Lesson content ✅

Goal: enough content for a real first week.

Spec: [`specs/phase-06-lesson-content/`](phase-06-lesson-content/). Branch `feature/lesson-content`.

- A 13-lesson curriculum in five units: right hand (treble), left hand (bass), both clefs, melodies, intervals and chords.
- Lessons are grouped by unit on Home; no lesson is locked.
- **Outcome:** `LESSON_UNITS` in `src/core/lessons.ts` holds the curriculum (`LESSON_CATALOG` is derived from it), with generators for random notes, intervals, and chords (no repeat in a row), fixed melodies split into phrases, and `nextLessonId`. A lesson has `pages` (at most 8 steps each), and the staff shows one page as a **row** of whole notes: played steps grey, the current step blue with a marker under it, chords as stacked noteheads, seconds with the upper note moved right (`src/core/staffRow.ts`). All content is white keys inside the computer-keyboard window of its base octave; a unit test enforces this. Saved progress is unchanged (`version: 1`); `note-reading` kept its id, and its title became "Around middle C".
- **Changed during the phase:** the user chose **no locks**, so "unlock order" became a **Next** badge on the first lesson without a finished run. After implementation, **chords are judged by held keys**: a chord step is done only when all its notes are down at once, a release removes a note, a wrong note is a mistake and cancels the attempt, and keys held from the previous step don't count. Single-note steps count at once, so legato playing works. This replaced the first rule (any order, one at a time). The judge now handles `noteoff`.
- Manual validation by the user was still open when this replan was written. Two spots most likely to need fixes: how an 8-note page and a chord page look at 360 px, and chords on the on-screen piano (they need several fingers).

## Phase 7 — PWA & offline ✅

Goal: installable and usable without a connection. Deployment itself moved up to Phase 3.

Spec: [`specs/phase-07-pwa-offline/`](phase-07-pwa-offline/). Branch `feature/pwa-offline` (started from `feature/lesson-content`; rebase onto `main` once Phase 6 is merged).

- Installable PWA (`vite-plugin-pwa`) with offline support; Android install hint.
- **Outcome:** `vite-plugin-pwa` 2 (supports Vite 8) generates the manifest and a Workbox service worker that precaches the whole build. `start_url`, `scope`, and the navigation fallback follow the base path, so both hosts work. The service worker is off in `bun run dev`. Updates use **prompt** mode: a "new version" banner with Reload / Later, held back while a lesson is open; the app never reloads by itself. A one-time "works offline" note. An install card on Home (`beforeinstallprompt`, captured before React renders); "Not now" is saved under `piano-tutor.installHint`. The show/hide rule is pure (`src/pwa/installHint.ts`) and unit-tested. The app icon is an agent-drawn `public/icon.svg`; `bun run icons` (`@vite-pwa/assets-generator`, dev only) makes the PNG / ICO sizes, which are committed.
- The user confirmed the production build works in local `preview`. Still open when this replan was written: the update flow and the install card checked step by step, Android install + airplane mode on the Cloudflare preview, the GitHub Pages check after merge, and a skim of the new `uk` / `de` / `fr` strings.

## Phase 8 — Responsive on-screen keyboard ✅

Goal: the on-screen piano fits every screen, from a phone in portrait to a wide monitor.

Spec: [`specs/phase-08-responsive-keyboard/`](phase-08-responsive-keyboard/). Branch `feature/responsive-keyboard`. From a backlog note (removed after the phase; decisions are in the spec).

- The piano uses the full window width; extra whole octaves are added around the computer-keyboard range while white keys stay ≥ 40 px, up to all 88 keys.
- When even the base range doesn't fit (phones), the piano scrolls horizontally on an octave ruler; keys always play. The view follows octave changes and the lesson's current step.

## Phase 9 — MIDI file playback ✅

Goal: open a `.mid` file and watch and hear it play: the piece is shown as sheet music, a cursor moves along the staff, and the sounding keys light up blue.

Spec: [`specs/phase-09-midi-file-playback/`](phase-09-midi-file-playback/). Branch `feature/midi-file-playback`. From the backlog item "Load a `.mid` file".

- In-house Standard MIDI File parser (formats 0 and 1, tempo map, time signatures, sustain pedal; percussion ignored). Opened with a file chooser; nothing leaves the device.
- A new **Player** mode: the score as sheet music (sharps, note values, rests, bars, ties; a simplified one-voice reduction) in systems, with a moving cursor and blue sounding notes.
- Playback through the note bus as a new source (`playback`), so the synth and the key highlight need no special code. Play / pause / stop, tempo 50–150 %, seeking by slider and by clicking the score.
- The on-screen piano shows the piece's range and follows what is playing on narrow screens.
- **Outcome:** `src/core/smf.ts` (parser; limits 2 MB, 50,000 notes, 4 hours; five error kinds, never throws), `playback.ts` (sorted schedule, `drain`, `indexAtTime`), `score.ts` (rounding to sixteenths, bars from time signatures, one voice per staff, rests, ties, sharps / naturals per bar) and `scoreLayout.ts` (systems stretched up to 2×, the time-to-x map for the cursor, two visible systems) are pure and unit-tested; `NoteSource` gained `playback`. `src/playback/player.ts` drives the clock (position from the clock, so no drift; events every 10 ms; every exit releases all notes) and is tested with a fake clock. `PlayerProvider` keeps the player and the open file for the whole app, so the file stays when the learner switches modes (playback stops). `ScoreView` draws Bravura outlines (sharp, natural, flags, rests), stems limited to their own staff, a per-frame cursor, and blue sounding notes. `PianoKeyboard` got `include` (the piece's range) and `followPlayback` (only a finger or the mouse stops the follow-scroll). The user validated the player on desktop and a phone.

## Phase 10 — MIDI library ✅

Goal: the Player comes with a library of free, public-domain classical piano pieces, grouped by composer and rated for difficulty, so there is something to play from the first minute.

Spec: [`specs/phase-10-midi-library/`](phase-10-midi-library/). Branch `feature/midi-library`.

- 34 pieces by 10 composers, from the **Mutopia Project**, only pieces whose own Mutopia page says **Public Domain** (no CC-BY or CC-BY-SA, so there is no licence burden). Every piece records its source, licence, and check date; a test enforces the allowlist and checks the files.
- Five difficulty levels, rated by hand; a Library panel inside the Player with composer sections, a difficulty filter, and a Favourites filter.
- Marks (favourite, done) saved on the device. Files are fetched on demand and cached by the service worker after the first open, so opened pieces work offline.
- **Changed during the phase (user requests):** **no composers of Russian origin** (Tchaikovsky's three pieces were removed and two easy pieces added), and a **portrait of every composer**, from Wikimedia Commons, only images whose Commons page says "Public domain" (cropped to 200 × 200 px JPEGs, precached for offline). Both are now part of the content policy: new pieces must be Public Domain on their own Mutopia page, new portraits must be public-domain Commons images, and composers of Russian origin are left out.
- **Outcome:** the catalogue (`src/core/libraryCatalog.ts`) is the single source of truth: 34 pieces in `public/library/<composer>/` rated 1–5 by hand (5 / 6 / 12 / 8 / 3 per level) and 10 composers with portraits. `library.ts` holds the pure rules (`browse`: filter by level and favourites, group by composer ordered by the name in the UI language, pieces by difficulty then title; the licence and host allowlists; URLs; initials) and `libraryMarks.ts` the marks (versioned JSON, `piano-tutor.library`). Tests enforce the policy and read the real files (`config/libraryFiles.test.ts`: each file exists, parses, matches its catalogue duration within 2 s, and is small; each portrait is a small JPEG). `PlayerProvider` gained `openLibraryPiece`; a host that answers a missing file with an HTML fallback page counts as a `network` error. Workbox caches `/library/*.mid` at runtime (`CacheFirst`, at most 60) and precaches the portraits. The user validated the library (licence spot check, difficulty ratings, layout, offline) and confirmed the licence policy.
- Mutopia's own "Public Domain" listing filter also returned CC-BY and CC-BY-SA pieces, so every piece was checked on its own page (the field is called "Copyright"). Several composers had no usable pieces: all of Satie on the first page is CC-BY-SA, and Clementi's sonatina is only offered as a zip.

## Phase 11 — Melody learning ✅

Goal: the learner picks a piece from the library and the app turns it into a course of lessons, from the simplest to the hardest, that teaches the opening of the piece.

Spec: [`specs/phase-11-melody-learning/`](phase-11-melody-learning/). Branch `feature/melody-learning`.

- A **Learn** button on every library piece opens a course built from the piece's own notation: the text is split into **parts** (phrases) of up to 4 bars, and the course covers the first 6 parts.
- Three stages: **right hand**, **left hand**, **both hands**. In a hand stage: read the notes the piece uses, then its chords, then the parts one by one, then the parts joined (1–2, 3–4, 5–6, 1–4, 1–6). In the both-hands stage: the parts, then the merges.
- Lessons show the real notation (sharps, note values, bars) with the current step marked, and use the existing judge (pitches only, no timing), stars, XP, and streak. No locks; a **Next** badge marks the first lesson not yet finished.
- A **"Pieces you are learning"** section on Home.
- **Outcome:** the course builder is pure (`src/core/course.ts`): steps come from the score's columns (a tied note is pressed once, rests are skipped), parts are at most 4 bars and 32 steps (first 6 parts), and a hand stage has at most 37 lessons per piece. A notes drill needs at least 2 distinct pitches and a chord drill at least 2 distinct chords; the both-hands stage exists only when both hand stages do. Lesson ids are stable (`melody:<pieceId>:<hand>:<kind>[-n]`), so the saved progress format is unchanged (`version: 1`). `src/course/` loads the piece and caches its course; lessons show their bars through the Player's `ScoreView` (`NotationView`; the current step is the "sounding" note and the cursor position), drills show quarter notes; the on-screen piano shows the lesson's whole range and the computer-key octave is picked to fit. `Lesson` gained optional `hand`, `pieceTitle`, `titleParams`, and `notation`; the judge is unchanged. Back from a course lesson returns to the course. No new dependencies. A test builds the course of all 34 library pieces from their real files. The user validated the feature by hand.

## Phase 12 — Keyboard size & calibration ✅

Goal: lessons and the on-screen piano know how many keys the learner's real keyboard has.

Spec: [`specs/phase-12-keyboard-size-calibration/`](phase-12-keyboard-size-calibration/). Branch `feature/keyboard-size-calibration`.

From a backlog note (removed after the phase; decisions are in the spec); split out of Phase 8 during its spec; moved from Phase 9 to Phase 10 when MIDI file playback was added, on to Phase 11 when the MIDI library was added, and on to Phase 12 when melody learning was added.

- A key-count setting (25 / 37 / 49 / 61 / 76 / 88) and calibration by pressing the lowest and highest key; "this note is not on your keyboard" handling.
- **Outcome:** one global range for the device (`KeyboardRange`: lowest and highest note, or `null` = not set, the default; saved as versioned JSON under `piano-tutor.keyboard`, invalid data means not set). A **Keyboard** button next to the MIDI status (shown when Web MIDI is available, hidden while a lesson is open) opens an inline panel: the six key counts with common start notes (25 / 37 from C3, 49 / 61 from C2, 76 from E1, 88 from A0), octave down / up (disabled at A0–C8), **Clear**, and **Calibrate** (needs a connected device): press the lowest key, then the highest; only `noteon` with source `midi` counts, the same key twice is ignored, and a disconnect stops it. The result (any size, also e.g. 32 keys) is saved or cancelled. Out-of-range keys of the on-screen piano are dimmed in every mode (they still play, light up, and flash); a lesson with notes outside the range shows a notice with the count of distinct pitches and the lowest / highest of them, and stays playable. The pure core is `src/core/keyboardRange.ts` (33 tests); `src/keyboard/` holds storage, the provider, and `useCalibration` (a note-bus subscriber). No new dependencies; the saved progress format is unchanged. **Manual validation was still open when this replan was written** (`validation.md`: the panel and the notice at 360 px, the dimmed key contrast, and calibration with a real MIDI keyboard; only the automated gates were run).

## Phase 13 — MusicXML import ✅

Goal: open a score exported from MuseScore (`.mxl` or `.musicxml`) in the Player and learn it as a course, with every note in the hand it was written for.

Spec: [`specs/phase-13-musicxml-import/`](phase-13-musicxml-import/). Branch `feature/musicxml-import`. A new phase requested by the user.

- In-house XML and zip readers (pure; decompression through `DecompressionStream`); MusicXML becomes the existing `Piece`, with the hand of each note taken from its staff.
- The Player opens MIDI and MusicXML files (detected by content); a **Learn** button builds a course from any file opened from disk. Stars are saved under an id from the file's content; the file is not kept, so it is not shown on Home.
- Not in this phase: tempo marks (fixed 120 bpm), repeats, grace notes, key signatures and real notation, MusicXML in the library.
- **Outcome:** three pure readers in `src/core/`: `xml.ts` (a minimal XML reader; `null` on malformed input, depth limit, DOCTYPE skipped and never expanded), `zip.ts` (the central directory of a zip and the score lookup through `META-INF/container.xml`) and `musicxml.ts` (`parseMusicXml` → the same `Piece` as a MIDI file: `divisions` merged into one tick unit with a float cursor, chords, `backup` / `forward`, ties, grace and cue notes, percussion parts and `<unpitched>` skipped, `<transpose>` applied, a pickup bar shifted so bar lines match the file, a fixed 120 bpm, the pedal from `<pedal>` directions). `PieceNote` gained an optional `hand` (staff 1 → right, 2+ → left in a part with several staves); `buildScore` draws such a note on that hand's staff (`spellNote(note, clef)` gives the ledger lines for the chosen staff), so the course builder splits hands by the file, not by middle C. `src/playback/loadScoreFile.ts` replaced `loadMidiFile.ts`: it detects `MThd`, a zip, or XML text by content, inflates with `DecompressionStream('deflate-raw')` (20 MB limit), and returns an id `file-<FNV-1a hash of the bytes>` (`core/contentHash.ts`). `CourseProvider` now takes a **source** (library piece or file); a **Learn** button next to the name of any file opened from disk builds its course from the open score. Lesson ids are `melody:file-<hash>:…`, so stars survive a reload of the same file; `piecesInProgress` ignores them, so they are not on Home. No new dependencies; the saved progress format is unchanged. **Manual validation with real MuseScore exports was still open when this replan was written** (see `validation.md`; only the automated gates were run, on files built in code).

## Backlog 💡

Ideas not yet scheduled — see `specs/backlog/` for notes.

- Play along with a `.mid` file: wait for the learner's notes step by step, judge them, and score the run (the player from Phase 9 only plays). Also: loop a section, mute a hand or track, drag and drop, a built-in example, a metronome / count-in.
- Chord / interval / key analyzer with a chord dictionary.
- Sheet-music view (started in Phase 4 with single notes on a grand staff; Phase 9 adds sharps, note values, rests, and bars for MIDI files; key signatures and flats, beams, tuplets, and several voices remain) and falling-notes ("waterfall") view.
- Session recorder with `.mid` export.
- Metronome and tempo-following play-along mode.
- Scales and arpeggio drills; adaptive practice.
- Dark mode / theming.
- From Phase 6: locked lessons / unlock gates (see [`backlog/lesson-unlocks.md`](backlog/lesson-unlocks.md)); rhythm and note values; accidentals and key signatures (black-key content); hands together; chord inversions, seventh chords, and an interval / chord naming quiz; a "played together within N ms" window for chords; a shorter page on narrow screens if 8 notes are too small.
- From Phase 12: a separate range per MIDI device and a MIDI device picker (the range is global today); a first-connect hint to set the keyboard size; guessing the size from the device name as a hint; marks on lesson cards, course lists, and library pieces for notes the keyboard lacks; choosing lessons by range, or transposing a lesson into it; sizing the on-screen piano to the range.
- From Phase 13: tempo marks, repeats / voltas, and grace notes from MusicXML; key signatures, flats as written, and several voices per staff (real notation, see the sheet-music item); keeping opened files on the device (IndexedDB) so a course from your own file shows on Home; `.mscz`; drag and drop; a hand override for MIDI files, which still split at middle C.
- From Phase 11: **timing and play-along** inside a course lesson (judge rhythm, not only pitches; tempo; a metronome); a hand override for pieces where the staff split puts a melody in the wrong hand; a "Next lesson" button on the summary; lessons for the rest of a long piece (beyond the first 6 parts) or a chosen section; a mastery mark on a piece when all its lessons have 3 stars; a course shortcut on the Player screen for the piece that is open.
- From Phase 10: a search box and sorting (by title or length); more pieces and composers, always Public Domain on the piece's own Mutopia page (for example Scarlatti, Liszt, Mendelssohn, and more of Haydn and Handel); a default tempo per piece (some Mutopia files carry the default 60 bpm, which is why the Rondo alla Turca was left out); showing a short note or biography per composer; recently played pieces; deep links to a piece; a computed difficulty to cross-check the hand ratings; letting a done mark count towards progress. CC-BY pieces with visible credit only if the licence policy is ever relaxed.
- From Phase 9: playing along with a file (see above); loop a section, mute a hand or a track, a metronome / count-in; drag and drop, a built-in example, remembering the last file; a scrollable overview of the whole score; key signatures and flats, beams, tuplets, and several voices per staff; a look-ahead scheduler (Web Audio) so playback stays on time in a background tab.
- From Phase 8: pinch-to-zoom or a setting for the key width; a "rotate to landscape" hint; tapping the ruler to move the base range; centring the scrolled view on the held notes of a chord.
- From Phase 7: an Install button outside Home (for example in the header) after the card was dismissed; a localized manifest name; manifest screenshots and app shortcuts (richer install UI); a designed app icon to replace the agent-drawn one.
- From Phase 5: streak freezes, badges, a progress history, and syncing progress between tabs (a `storage` event listener).
- From Phase 2: a setting for the note-name convention independent of the language (e.g. letters in `uk`); a MIDI device picker; glissando on the on-screen piano (sliding a finger onto the next key plays it); a sustain key for computer / touch input.

**Tooling backlog** (small fixes; they don't need a phase, see [`backlog/tooling.md`](backlog/tooling.md)):

- Upgrade to TypeScript 7 once `typescript-eslint` supports it.
- `.gitattributes` to normalise line endings (LF in the repo).
- Component / end-to-end smoke tests (Testing Library or Playwright), so manual browser checks can be automated.
- Pre-commit hooks (format + lint), if missed formatting becomes a recurring problem in CI.
