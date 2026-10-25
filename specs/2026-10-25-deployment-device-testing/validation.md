# Validation — Deployment & device testing

The feature is done (and the branch can be merged) only when every box is checked.

## Automated

- [ ] `bun run lint` passes
- [ ] `bun run format:check` passes
- [ ] `bun run build` passes
- [ ] `bun run test` passes — `config/buildInfo.test.ts` covers FR-2
- [ ] CI is green on the PR; the `deploy-github-pages` job is **skipped** on the PR (FR-4)

## Manual checks

Local: `bun run dev`, open http://localhost:3000 in Chrome.

- [ ] FR-1: `BASE_PATH=/piano-tutor/ bun run build`, then `bun run preview` → open `http://localhost:4173/piano-tutor/`. The app loads, DevTools Network shows no 404s, and the asset URLs in `dist/index.html` start with `/piano-tutor/`. A plain `bun run build` gives asset URLs starting with `/assets/`.
- [ ] FR-2: covered by unit tests; also, in the deployed sites below, the footer shows the commit that is live (compare with `git log -1 --format=%h origin/main`).
- [ ] FR-3: locally the footer shows `Build dev · local`. Switch the language to `uk`, `de`, `fr` → "Build" and "local" are translated; the footer is small and doesn't push the piano off a 360 px wide screen.
- [ ] FR-4: after merging to `main`, the Actions run shows `verify` then `deploy-github-pages`, and the deploy job succeeds. (If you test this before merge, use a push that fails `verify` to confirm nothing is deployed, or check the job condition in the workflow file.)
- [ ] FR-5: open `https://sergshtelmakh.github.io/piano-tutor/` in Chrome → HTTPS, no 404s in DevTools, the on-screen piano and computer keyboard play, the language selector works, the footer shows `GitHub Pages` and the merged commit.
- [ ] FR-6: the Cloudflare Pages project uses the settings in `README.md`; the first build log shows Bun installing and `vite build` succeeding.
- [ ] FR-7: the preview URL of `feature/deployment-device-testing` loads and plays, with the footer showing `Cloudflare Pages` and the branch's commit. After merge, `https://<project>.pages.dev/` shows the `main` commit.
- [ ] FR-8: `README.md` lists both live URLs and the deploy setup for each host; the links open.
- [ ] FR-9 **(MIDI, desktop, required)**: on the deployed site in desktop Chrome with a real keyboard:
  - Click **Connect MIDI keyboard**, allow → the device name is listed.
  - Play soft and loud → notes sound with clearly different volume and light up.
  - Unplug → the device disappears from the list without a reload; plug it back in → it reappears and plays.
  - Hold a key and unplug → the sound stops and the key goes dark (no stuck note).
  - Press the pedal, play a chord, release the keys → the chord keeps sounding; release the pedal → it stops. Hold one key and release the pedal → only that key keeps sounding.
- [ ] FR-10 **(MIDI, Android, required)**: on Android Chrome with the keyboard on USB-OTG, open the deployed site → Connect lists the device; notes play with velocity; the pedal sustains. Touch the on-screen piano with two fingers → both notes sound.
- [ ] FR-11: any bug found above is fixed, with a unit test if it was in pure logic; `specs/backlog/midi-device-check.md` lists device, OS, browser, and the result of each check.
- [ ] FR-12: `hosting-comparison.md` is filled in; the user's choice is written down there.
- [ ] Works with computer keyboard (`A S D F…`) without a MIDI device, on both hosts
- [ ] No console errors locally and on both hosts
- [ ] Neither host has analytics turned on
- [ ] User-facing text comes from the translations module, with keys in all locales (`en`, `uk`, `de`, `fr`); the user skims the new strings

## Constitution follow-up

- [ ] `specs/roadmap.md` — phase status updated
- [ ] `specs/tech-stack.md` — hosting row confirmed with the chosen host and reason; project layout mentions `config/`; the "real MIDI device" debt removed if FR-9 / FR-10 pass
- [ ] `CHANGELOG.md` / README updated (live URLs, MIDI tested on devices)
