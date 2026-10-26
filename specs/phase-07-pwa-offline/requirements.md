# Requirements — PWA & offline

## Context

Roadmap Phase 7: the app becomes **installable** and **usable without a connection**. Phases 1–6 built a client-side app with no backend: lessons, the synth, progress, and translations all run in the browser, and there are no web fonts or remote assets. So once the build files are cached, nothing needs the network. Web MIDI doesn't need the network either.

What exists today:

- Two hosts with different base paths (Phase 3): GitHub Pages serves production under `/piano-tutor/`, and Cloudflare Workers static assets serve per-branch previews from `/`. `config/buildInfo.ts` resolves the base path per build. The manifest and the service worker must work under both.
- There is no favicon, no app icon, and no `public/` folder yet.
- The app's accent colour is Tailwind `sky-600` (`#0284c7`) and its background is `slate-50` (`#f8fafc`).
- Screens are plain app state (Home / free play / open lesson), and there is no router, so offline navigation only needs `index.html`.
- Settings and progress live in `localStorage` under `piano-tutor.*` keys. A service-worker update doesn't touch them (same origin).

`specs/tech-stack.md` already names `vite-plugin-pwa` for the PWA row. This phase confirms that choice.

The clarifying questions and their answers are in the **Decisions** table. Rows marked _(agent default)_ were not asked; please review them.

## Functional requirements

**Installable app**

- **FR-1** The production build ships a web app manifest with: name "Piano Tutor", short name "Piano Tutor", `display: standalone`, no fixed orientation, `start_url` and `scope` equal to the build's base path (`/` or `/piano-tutor/`), theme colour `#0284c7`, background colour `#f8fafc`, and icons at 192 × 192 and 512 × 512 plus a 512 × 512 **maskable** icon. Chrome DevTools (Application → Manifest) shows no errors or installability warnings on both hosts.
- **FR-2** The app has an icon: a simple SVG drawn for this project (piano keys with a note), used as the favicon, plus PNGs generated from it for the manifest and an `apple-touch-icon` (180 × 180). `index.html` also gets a `theme-color` meta tag and a short `description`.

**Offline**

- **FR-3** After one visit online (once the service worker has installed), the app opens and works **fully offline**, including after a reload and after closing and reopening the browser or the installed app: Home, every lesson, free play, sound, saving progress, switching language, and MIDI input.
- **FR-4** The service worker is registered only in production builds (`bun run build` / `preview` and the deployed sites). Its scope is the base path. `bun run dev` doesn't register one, so the dev loop is unchanged.
- **FR-5** The first time the app is ready offline, a short note says so ("Piano Tutor now works offline.") with an **OK** button. It doesn't block input and isn't shown again.

**Updates**

- **FR-6** When a new version has been deployed and downloaded, a banner says "A new version is available." with **Reload** and **Later** buttons. **Reload** activates the new version and reloads the page. **Later** hides the banner until the next app start. The app **never reloads by itself**. While a lesson is open, the banner is not shown; it appears once the learner leaves the lesson. Progress and settings survive the update.

**Install hint**

- **FR-7** When the browser offers installation (the `beforeinstallprompt` event, in Chrome on Android and desktop), **Home** shows a dismissible card: "Install Piano Tutor: open it from your home screen and practise offline." with **Install** and **Not now** buttons.
  - **Install** opens the browser's install dialog. After the app is installed (`appinstalled`) or the dialog is accepted, the card disappears.
  - **Not now** hides the card for good. The choice is saved in `localStorage` (`piano-tutor.installHint`, try/catch). If storage is blocked, the card stays hidden for the session.
  - The card is not shown in an open lesson, in free play, when the app already runs installed (`display-mode: standalone`), or in browsers that don't fire the event (Safari, Firefox). Those browsers get no hint and no error.

**Translations**

- **FR-8** Every new string (the offline-ready note, the update banner, the install card, the button labels) exists in `en`, `uk`, `de`, `fr`. The manifest name stays "Piano Tutor" in every language (it is the product name).

## Non-functional requirements

- User-facing text goes through the translations module (English is the default; `uk`, `de`, and `fr` get the keys too).
- Works with the on-screen and computer keyboard (no MIDI device required).
- No added input latency: the service worker only serves app files and never sees note events.
- Privacy: no analytics, no push, and no requests other than the app's own files.
- Banners are text with real buttons (no colour-only signals), are announced politely (`role="status"`), and don't cover the staff or the piano at 360 px.
- The pure rule that decides whether the install card is shown is a plain function with unit tests. Browser APIs (service worker, `beforeinstallprompt`, `matchMedia`) stay in a thin adapter.
- New dependencies: only those justified in `plan.md`.

## Out of scope

- Push notifications, background sync, periodic sync.
- iOS / Safari install instructions (Safari is not a target browser. "Add to Home Screen" works there by hand with the `apple-touch-icon`.)
- A localized manifest name, app shortcuts, and manifest screenshots (the richer install UI).
- An "Install" button outside Home (for example in the header) after the card was dismissed.
- Offline caching of anything not in the build (there is nothing else today).
- File handling (opening `.mid` files with the installed app); that belongs to the `.mid` backlog item.

## Decisions

| Question                                        | Decision                                                                                                                         | Reason                                                                                                            |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| How updates reach an open app                   | Prompt: "A new version is available" with Reload / Later; never an automatic reload                                              | User choice: a lesson is never cut off.                                                                           |
| Install hint                                    | A dismissible card on Home (Install / Not now); "Not now" is permanent                                                           | User choice: visible once, then out of the way.                                                                   |
| App icon                                        | An agent-drawn SVG; PNGs generated from it once with a dev-only tool and committed                                               | User choice; it can be replaced later by swapping the SVG and running the script again.                           |
| Orientation                                     | Not fixed (follows the device)                                                                                                   | User choice: portrait already works at 360 px, and landscape gives the piano more room.                           |
| Update banner during a lesson _(agent default)_ | Held back until the lesson is closed                                                                                             | Reload is safe at any time, but the banner would distract mid-lesson.                                             |
| Offline-ready note _(agent default)_            | Shown once, with an OK button                                                                                                    | The learner learns the app works offline; it also makes FR-3 easy to check.                                       |
| Service worker in dev _(agent default)_         | Off; checks use `bun run build` + `bun run preview` and the deployed sites                                                       | A dev service worker caches stale modules and confuses hot reload.                                                |
| Manifest language _(agent default)_             | English only; the name is the product name in every locale                                                                       | A manifest has one language; "Piano Tutor" is a name, not a sentence.                                             |
| Colours _(agent default)_                       | Theme `#0284c7` (sky-600, the app's accent), background `#f8fafc` (slate-50, the page background)                                | Matches the current UI, so the splash screen and title bar look like the app.                                     |
| Branch base _(agent default)_                   | `feature/pwa-offline` starts from `feature/lesson-content` (Phase 6 is not merged yet); the PR is opened after Phase 6 is merged | Phase 7 needs the Phase 6 roadmap and code. Rebase onto `main` once Phase 6 is merged, so the PR stays one phase. |
