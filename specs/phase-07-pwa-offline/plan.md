# Plan — PWA & offline

> Roadmap phase: Phase 7 — PWA & offline
> Branch: `feature/pwa-offline`
> Status: Implemented (manual validation open)

## Goal

The learner can install Piano Tutor on Android or desktop Chrome, open it from the home screen, and practise without a connection. New versions arrive with a "Reload" prompt that never interrupts a lesson.

## Approach

**Build (`vite.config.ts`)**

- Add `VitePWA` from `vite-plugin-pwa` with `registerType: 'prompt'`, `strategies: 'generateSW'` (Workbox precache of the whole build: `**/*.{js,css,html,svg,png,webmanifest}`), `navigateFallback: 'index.html'`, and `injectRegister: false` (the app registers the worker itself, see below). `devOptions.enabled` stays `false` (FR-4).
- The manifest is written in the plugin config (FR-1). `start_url` and `scope` come from `basePath` (already resolved by `resolveBuildInfo`), so one config works for `/` and `/piano-tutor/`. Vite already prefixes the generated `manifest.webmanifest` link and `sw.js` registration with `base`.
- `tsconfig` / `src/env.d.ts`: add the `vite-plugin-pwa/react` client types for the `virtual:pwa-register/react` module.

**Icons (`public/`)**

- `public/icon.svg`: a hand-drawn SVG (a few piano keys and a note, sky-600 on white, with safe padding so it survives the maskable crop).
- `@vite-pwa/assets-generator` (dev only) with a small `pwa-assets.config.ts` and a `bun run icons` script. It generates `pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png`, `apple-touch-icon-180x180.png`, and `favicon.ico` into `public/`. The PNGs are committed, so CI and the deploy jobs don't run the generator.
- `index.html`: `<link rel="icon" href="/icon.svg" type="image/svg+xml">`, the `apple-touch-icon` link, `<meta name="theme-color" content="#0284c7">`, and `<meta name="description">` (FR-2). Root-absolute `/…` paths in `index.html` are rewritten by Vite to the base.

**Runtime (`src/pwa/`, thin adapters)**

- `usePwaUpdate.ts`: wraps `useRegisterSW` from `virtual:pwa-register/react`. Exposes `offlineReady`, `needRefresh`, `reload()` (calls `updateServiceWorker(true)`), and `dismiss()`. "Later" only clears `needRefresh` in memory (FR-6).
- `installPrompt.ts`: imported from `main.tsx` **before** React renders, so an early `beforeinstallprompt` isn't missed. It calls `preventDefault()`, keeps the event, listens for `appinstalled`, and offers a tiny subscribe / get-snapshot store for `useSyncExternalStore`. `promptInstall()` calls `event.prompt()` and clears the event after `userChoice`.
- `installHint.ts` (pure, no DOM): `shouldShowInstallHint({ canPrompt, dismissed, standalone, screen })` returns `true` only for `canPrompt && !dismissed && !standalone && screen === 'home'`. Unit-tested (FR-7).
- `storage.ts`: `loadInstallHintDismissed()` / `saveInstallHintDismissed()` under `piano-tutor.installHint`, in try/catch like `i18n/storage.ts`. If saving fails, the in-memory flag still hides the card for the session.
- `useInstallHint.ts`: combines the store, storage, and `matchMedia('(display-mode: standalone)')`, then calls the pure rule.

**UI (`src/components/`)**

- `OfflineReadyNote.tsx` (FR-5) and `UpdateBanner.tsx` (FR-6): small fixed bars at the bottom of the screen, `role="status"`, text plus buttons, narrow enough for 360 px. `App` renders them; `UpdateBanner` gets `hidden={entry !== undefined}`, so it waits until a lesson is closed.
- `InstallCard.tsx` (FR-7): a card on `HomeScreen` above the units, with Install / Not now.

**Translations**: keys for the offline-ready note, the update banner, the install card, and the button labels, in `en` first, then `uk`, `de`, `fr` (FR-8).

## Task groups

1. **Icon and static head**
   - [x] `public/icon.svg` (piano keys + note, maskable-safe padding)
   - [x] `@vite-pwa/assets-generator` dev dependency, `pwa-assets.config.ts`, `bun run icons` script; generate and commit the PNGs and `favicon.ico`
   - [x] `index.html`: favicon, apple-touch-icon, `theme-color`, `description` (FR-2)
2. **Manifest and service worker**
   - [x] `vite-plugin-pwa` dev dependency; `VitePWA` in `vite.config.ts` with the manifest from FR-1, `registerType: 'prompt'`, precache patterns, `navigateFallback`, `injectRegister: false`, dev off (FR-1, FR-4)
   - [x] Client types for `virtual:pwa-register/react`
   - [x] Check `dist/` for both bases: `bun run build` and `BASE_PATH=/piano-tutor/ bun run build`. `manifest.webmanifest`, `sw.js`, and the icon links point inside the base, and `start_url` / `scope` match it
   - [ ] Check `bun run preview`: DevTools → Application shows the manifest without errors and an activated service worker. Offline + reload still works (FR-3)
3. **Offline-ready note and update banner**
   - [x] `src/pwa/usePwaUpdate.ts`
   - [x] `OfflineReadyNote` and `UpdateBanner` in `App`; banner hidden while a lesson is open (FR-5, FR-6)
   - [ ] Check the update flow: build, preview, change a string, build again, refresh. The banner appears; Later hides it; Reload shows the new version; progress is kept
4. **Install hint**
   - [x] `src/pwa/installHint.ts` (pure) with unit tests: every combination of `canPrompt` / `dismissed` / `standalone` / `screen`
   - [x] `src/pwa/installPrompt.ts` (captured from `main.tsx`), `storage.ts`, `useInstallHint.ts`
   - [x] `InstallCard` on `HomeScreen` (FR-7)
5. **Translations, docs, validation**
   - [x] All new keys in `en`, `uk`, `de`, `fr` (FR-8)
   - [x] `README.md`: an "Install and offline" section (how to install, that the first visit must be online, how updates arrive)
   - [ ] Run `validation.md`: automated gates, then manual checks on `preview` and on the Cloudflare branch preview (Android Chrome install + airplane mode); ask the user to skim the new `uk` / `de` / `fr` strings

## Files touched

| File                                                                               | Change                                                                               |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `package.json`, `bun.lock`                                                         | `vite-plugin-pwa`, `@vite-pwa/assets-generator` (dev); `icons` script                |
| `vite.config.ts`                                                                   | `VitePWA` plugin with manifest and Workbox options                                   |
| `pwa-assets.config.ts` (new)                                                       | Icon generator config                                                                |
| `public/icon.svg`, `public/*.png`, `public/favicon.ico` (new)                      | App icon and generated sizes                                                         |
| `index.html`                                                                       | Favicon, apple-touch-icon, theme colour, description                                 |
| `src/env.d.ts` / `tsconfig.app.json`                                               | PWA client types                                                                     |
| `src/main.tsx`                                                                     | Import `pwa/installPrompt.ts` before render                                          |
| `src/pwa/` (new)                                                                   | `usePwaUpdate`, `installPrompt`, `installHint` (+ test), `storage`, `useInstallHint` |
| `src/components/OfflineReadyNote.tsx`, `UpdateBanner.tsx`, `InstallCard.tsx` (new) | Banners and install card                                                             |
| `src/App.tsx`, `src/components/HomeScreen.tsx`                                     | Render the banners and the card                                                      |
| `src/i18n/locales/{en,uk,de,fr}.ts`                                                | New strings                                                                          |
| `README.md`                                                                        | Install and offline section                                                          |

## New dependencies

- **`vite-plugin-pwa`** (dev dependency; already named in `tech-stack.md`). It generates the manifest and a Workbox service worker with a precache list that matches the hashed build files, and handles the base path. Hand-writing a service worker means building and keeping our own precache manifest of hashed assets, plus update and cache-cleanup logic. It is the code that is most likely to break offline mode silently. At runtime, the only code it adds to the bundle is `workbox-window` (a few KB, used by `virtual:pwa-register`) and the generated `sw.js`.
- **`@vite-pwa/assets-generator`** (dev dependency, run by hand). It makes the PNG and ICO sizes from one SVG. Nothing in the repo can rasterise an SVG today. Its output is committed, so it never runs in CI.

## Risks & open questions

- **Vite 8 support:** if the current `vite-plugin-pwa` doesn't support Vite 8, the plan changes (spec first): a small hand-written `public/sw.js` with a precache list emitted by a tiny Vite plugin, no Workbox. Check this at the start of group 2.
- **Stale `sw.js` caching on the hosts:** GitHub Pages serves files with `max-age=600`, and Cloudflare static assets have their own defaults. Browsers check `sw.js` for updates bypassing the HTTP cache (`updateViaCache: 'imports'` default), so at worst an update shows up a few minutes late. Confirm on both hosts during validation.
- **Cloudflare preview URLs** are separate origins per branch, so each preview installs its own worker. That's expected and doesn't affect production.
- **`beforeinstallprompt` timing:** Chrome fires it only after its install criteria are met and may delay it, so the card might not appear on the first visit. Validation uses DevTools (Application → Manifest → "Install") or a second visit.
- **Icon quality:** the agent-drawn icon is a placeholder-level design. The user may want to replace it later (swap `public/icon.svg`, run `bun run icons`).
