# Roadmap

> Part of the project **constitution**. A living document: **what** we build and **in what order**.
> Each phase becomes one feature spec folder (`specs/phase-NN-<slug>/`) and one branch/PR.
> Keep phases small enough to implement and validate in one session. Re-plan between phases.
>
> Status: `✅ done` · `🔨 in progress` · `📋 planned` · `💡 idea (backlog)`
>
> Phases 1–4 are done. Phases 3–7 were reordered after Phase 2 (deployment moved up to Phase 3, PWA split out as Phase 7); re-check each one when its spec is written.

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

## Phase 5 — Game mechanics & local progress 📋

Goal: a reason to come back tomorrow.

- XP, levels, daily streak; rewards shown on lesson completion.
- Progress saved to `localStorage` (graceful when unavailable).
- Simple progress/home screen with a list of lessons and their stars/best accuracy.

## Phase 6 — Lesson content 📋

Goal: enough content for a real first week.

- Lesson format and a small curriculum (single notes → both hands separately → simple melodies → intervals/chords).
- Unlock order tied to progress.

## Phase 7 — PWA & offline 📋

Goal: installable and usable without a connection. Deployment itself moved up to Phase 3.

- Installable PWA (`vite-plugin-pwa`) with offline support; Android install hint.

## Backlog 💡

Ideas not yet scheduled — see `specs/backlog/` for notes.

- Load a `.mid` file and play it step by step (custom MIDI parser).
- Chord / interval / key analyzer with a chord dictionary.
- Sheet-music view (started in Phase 4 with single notes on a grand staff; chords, rhythm, and melodies remain) and falling-notes ("waterfall") view.
- Session recorder with `.mid` export.
- Metronome and tempo-following play-along mode.
- Scales and arpeggio drills; adaptive practice.
- Dark mode / theming.
- From Phase 2: a setting for the note-name convention independent of the language (e.g. letters in `uk`); a MIDI device picker; glissando on the on-screen piano (sliding a finger onto the next key plays it); a sustain key for computer / touch input.

**Tooling backlog** (small fixes; they don't need a phase, see [`backlog/tooling.md`](backlog/tooling.md)):

- Upgrade to TypeScript 7 once `typescript-eslint` supports it.
- `.gitattributes` to normalise line endings (LF in the repo).
- Component / end-to-end smoke tests (Testing Library or Playwright), so manual browser checks can be automated.
- Pre-commit hooks (format + lint), if missed formatting becomes a recurring problem in CI.
