# Requirements — Deployment & device testing

## Context

Roadmap Phase 3. Phases 1–2 built a free-play piano that runs only on `localhost`. Web MIDI needs a secure context, so the app has never been tried on a phone, and the real-device MIDI checks from Phase 2 (FR-3 / FR-4 / FR-11 in `specs/2026-10-25-input-pipeline-keyboard/validation.md`) are still open. See `specs/backlog/midi-device-check.md`.

This phase publishes the app over HTTPS on **two** static hosts at the same time, GitHub Pages and Cloudflare Pages, so they can be compared before one is chosen. It also runs the open MIDI checks on the deployed site. Deploying early means every later phase can be tested on real hardware as it ships.

The clarifying questions and their answers are in the **Decisions** table below.

## Functional requirements

**Build**

- **FR-1** The production build must take its base path from the build environment: `/` by default (local, Cloudflare Pages) and `/piano-tutor/` for GitHub Pages. All asset URLs in the built `index.html` must respect it, so the app loads under a sub-path with no 404s.
- **FR-2** The build must record which build it is: the short commit hash (7 characters) and the deploy target (`github-pages`, `cloudflare-pages`, or `local`). They come from the CI environment (`GITHUB_SHA`, Cloudflare's `CF_PAGES` / `CF_PAGES_COMMIT_SHA`) or an explicit `DEPLOY_TARGET`. When nothing is set, it is a local build with commit `dev`. Resolving these values is a pure, unit-tested function.
- **FR-3** The app must show a small footer line with the build info, for example `Build a1b2c3d · Cloudflare Pages`, or `Build dev · local` in local development. The word "Build" and the word "local" are translated (`en`, `uk`, `de`, `fr`); host names are proper nouns and are not translated.

**GitHub Pages**

- **FR-4** On every push to `main`, after the existing CI `verify` job passes, a deploy job must build with base `/piano-tutor/` and target `github-pages` and publish `dist/` to GitHub Pages with the official `actions/upload-pages-artifact` + `actions/deploy-pages` actions. Pull requests and other branches must not deploy to GitHub Pages. If `verify` fails, nothing is deployed.
- **FR-5** The GitHub Pages site (`https://sergshtelmakh.github.io/piano-tutor/`) must load over HTTPS and work: the on-screen piano and computer keyboard play sound, the language selector works, and the footer shows the deployed commit.

**Cloudflare Pages**

- **FR-6** Cloudflare Pages must be connected to the repository through its **Git integration** (set up once in the Cloudflare dashboard by the user). The build settings (build command, output directory, Bun version, production branch `main`) must be documented in the repo, so the setup can be repeated. No Cloudflare secrets are stored in GitHub.
- **FR-7** Pushes to `main` must update the Cloudflare production site (`https://<project>.pages.dev/`). Every other branch / PR must get its own preview URL. The production site and at least one preview (this phase's branch) must load over HTTPS and work as in FR-5, with the footer showing `Cloudflare Pages` and the right commit.

**Docs**

- **FR-8** `README.md` must list both live URLs and explain how each host is deployed (GitHub Pages: CI job on `main`; Cloudflare Pages: Git integration with the documented settings, previews per branch).

**Real-device MIDI** (required to finish this phase)

- **FR-9** On the deployed HTTPS site in desktop Chrome with a real MIDI keyboard, the open Phase 2 checks must pass: connect shows the device name, notes play with velocity and light up, hot-plug (unplug / replug) updates the list without a reload, a note held while unplugging is released, and the sustain pedal works as in Phase 2 FR-11.
- **FR-10** On Android Chrome with a MIDI keyboard over USB-OTG, the deployed site must connect to the keyboard and play notes with velocity and the sustain pedal, and the on-screen piano must work with multi-touch.
- **FR-11** Bugs found by FR-9 / FR-10 in the existing MIDI code (`src/input/midiAccess.ts`, `src/core/midi.ts`, `src/core/heldNotes.ts`) must be fixed in this phase, with a unit test for any pure-logic fix. The results are written into `specs/backlog/midi-device-check.md` (device model, browser, OS, what passed). The note is closed once everything passes.

**Host comparison**

- **FR-12** A short comparison of the two hosts must be recorded in this spec folder (`hosting-comparison.md`): setup effort, deploy time from push to live, previews, first-load speed measured on the same phone/laptop, limits of the free tier, and anything that broke. The user then picks one host or keeps both. The choice, with a reason, goes into the hosting row of `specs/tech-stack.md` during replan.

## Non-functional requirements

- User-facing text goes through the translations module (English default; add keys for `uk`, `de`, `fr` too).
- Works with the on-screen and computer keyboard (no MIDI device required) on both hosts.
- No perceptible added input latency (deployment changes nothing in the note pipeline).
- No new runtime dependencies. No analytics or tracking: neither host's analytics is turned on, so the privacy note stays true (mission principle 5).
- No secrets in the repository. The GitHub Pages job uses only the built-in `GITHUB_TOKEN` with `pages: write` and `id-token: write`.
- The existing CI gates keep running unchanged on every PR.

## Out of scope

- PWA, service worker, offline support (Phase 7).
- A custom domain.
- SPA routing / 404 fallback (the app has one screen and no routes).
- GitHub Pages previews per PR (not available for free).
- Deploying Cloudflare from GitHub Actions (`wrangler`), which was rejected in favour of the Git integration.
- A MIDI device picker and the other Phase 2 backlog ideas.

## Decisions

| Question                                 | Decision                                                                   | Reason                                                                                          |
| ---------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| How does Cloudflare Pages get the build? | Git integration in the Cloudflare dashboard                                | Previews for every branch / PR with no CI code and no secrets in GitHub. One manual setup step. |
| When does GitHub Pages deploy?           | A deploy job after `verify` passes, on pushes to `main` only               | Only tested code goes live; no manual trigger needed.                                           |
| Show which build is running?             | Yes: short commit + host in a footer line                                  | Makes it easy to compare hosts and to see whether a phone has the latest build.                 |
| Real-device MIDI check: how strict?      | **Required** to finish the phase (desktop Chrome and Android Chrome + OTG) | The MIDI code has never run against a device; this is the first chance on HTTPS.                |
| Where does the host comparison go?       | `hosting-comparison.md` in this folder; the choice into `tech-stack.md`    | Keeps the measurements with the phase; the constitution only records the decision.              |
| Base path mechanism                      | `BASE_PATH` env var read in `vite.config.ts`, default `/`                  | One build per host, as the roadmap says; no code change between hosts.                          |
