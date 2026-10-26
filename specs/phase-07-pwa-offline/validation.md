# Validation — PWA & offline

The feature is done (and the branch can be merged) only when every box is checked.

## Automated

- [ ] `bun run lint` passes
- [ ] `bun run format:check` passes
- [ ] `bun run build` passes; `dist/` contains `manifest.webmanifest`, `sw.js`, and the icons
- [ ] `BASE_PATH=/piano-tutor/ bun run build` passes; in `dist/index.html` the manifest, icon, and script links start with `/piano-tutor/`, and the manifest has `start_url` and `scope` `/piano-tutor/`
- [ ] `bun run test` passes; `shouldShowInstallHint` has unit tests for every input combination
- [ ] CI is green on the PR

## Manual checks

The service worker runs only in production builds. Run `bun run build && bun run preview` and open the printed `http://localhost:…` URL in Chrome, unless a step names a deployed site.

- [ ] FR-4: `bun run dev` on http://localhost:3000: DevTools → Application → Service workers lists none for this origin (unregister any left over from `preview` first if the port matches).
- [ ] FR-1: On `preview`, DevTools → Application → Manifest shows the name, the colours, `standalone`, and all icons (including maskable) without errors or warnings. The install icon appears in the address bar.
- [ ] FR-2: The browser tab shows the new favicon. The 180 px `apple-touch-icon` loads (Network tab, or open its URL).
- [ ] FR-5: In a fresh profile (or after "Clear site data"), open the app: once the worker has installed, "Piano Tutor now works offline." appears. OK hides it. Reloading doesn't show it again.
- [ ] FR-3: DevTools → Network → Offline (or stop `preview`), then reload: the app loads. Home lists the lessons; a lesson can be played to the end and its result is saved; free play makes sound; switching language works. Close the tab, reopen the URL while still offline: it still loads.
- [ ] FR-6: With the app open on `preview`, change a visible string, run `bun run build` again, and focus or reload the tab: "A new version is available." appears. **Later** hides it. Reload, then **Reload** in the banner: the change is visible and progress and settings are kept. Start a lesson before the new build is detected: the banner does not appear during the lesson, but does once the lesson is closed. The page never reloads by itself.
- [ ] FR-7: On `preview` in desktop Chrome, the install card appears on Home (if Chrome hasn't fired `beforeinstallprompt` yet, reload or wait). It doesn't show in free play or an open lesson. **Install** opens the install dialog; after installing, the card is gone and the app opens in its own window without the card. Uninstall, clear site data, open again: **Not now** hides the card, and it stays hidden after a reload.
- [ ] FR-7: In Firefox (or any browser without `beforeinstallprompt`), Home shows no card and the console has no errors.
- [ ] FR-8: Switch to `uk`, `de`, `fr`: the offline note, the update banner, and the install card are translated. **The user skims the new translations.**
- [ ] At 360 px width (DevTools device mode), the banners and the install card fit without horizontal scrolling and don't cover the piano keys.
- [ ] **Deployed, Android:** on the Cloudflare branch preview in Android Chrome, install the app from the card (or the menu). It opens standalone with the icon and splash colours. Turn on airplane mode, close and reopen the app: a lesson plays with the on-screen piano. With a USB-OTG MIDI keyboard (optional), notes are judged offline.
- [ ] **Deployed, GitHub Pages** (after merge): the production site under `/piano-tutor/` installs and works offline the same way (scope `/piano-tutor/`).
- [ ] Works with the computer keyboard and the on-screen piano (touch / mouse) offline; works with a MIDI keyboard if one is available (optional).
- [ ] No console errors (online and offline).
- [ ] User-facing text comes from the translations module, with keys in all locales (`en`, `uk`, `de`, `fr`).

## Constitution follow-up

- [ ] `specs/roadmap.md`: Phase 7 marked done, with the outcome
- [ ] `specs/tech-stack.md`: PWA row confirmed (plugin, `prompt` updates, precache), `src/pwa/` and `public/` in the project layout, the icon script, and known debt (service worker and install flow verified only manually)
- [ ] `CHANGELOG.md` and `README.md` updated (install and offline)
