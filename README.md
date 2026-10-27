# Piano Tutor

A gamified piano-learning web app: connect a MIDI keyboard (Web MIDI) and get real-time feedback on whether you play the right notes. Client-side only, no backend. See [specs/mission.md](specs/mission.md).

> Status: free play, a first lesson, and local progress (stars, XP, levels, daily streak) work and are deployed online (roadmap Phases 2–4): MIDI keyboard, computer keyboard, and on-screen piano all make sound, and a 13-lesson first-week curriculum trains note reading, melodies, intervals, and chords on a music staff. More content comes in later phases — see [specs/roadmap.md](specs/roadmap.md).

## Prerequisites

- [Bun](https://bun.sh) (npm also works)
- A Chromium-based browser (Chrome, Edge) for Web MIDI. Other browsers can still play with the on-screen piano and computer keyboard.

## Getting started

```bash
bun install
bun run dev      # http://localhost:3000
```

## How to play

- **MIDI keyboard:** click **Connect MIDI keyboard** and allow access. Every connected keyboard works, including the sustain pedal. Web MIDI needs Chrome or Edge and a secure page (HTTPS or `localhost`).
- **Computer keyboard:** `A S D F G H J K L ;` are the white keys (C D E F G A B C D E) and `W E T Y U O P` are the black keys. The left `Shift` key (`⇧`) plays the B just below the first C. `Z` / `X` shift the octave down / up. Keys are matched by physical position, so this works on QWERTZ and AZERTY layouts too.
- **On-screen piano:** click or touch the keys. The piano is as wide as the window and shows more octaves when they fit (keys stay at least 40 px wide, up to all 88 keys on a wide monitor). On a narrow phone it keeps finger-sized keys and scrolls sideways: swipe the octave ruler above the keys (swiping the keys plays them). The octave buttons and `Z` / `X` move the range the computer keyboard plays (B2–C5 by default: the B below the first C, two octaves, and the top C), and the view follows.
- **Home and lessons:** the app opens on **Home**, with 13 lessons in five units: right hand (treble clef), left hand (bass clef), both clefs, melodies (Mary Had a Little Lamb, Ode to Joy, Twinkle Twinkle), and intervals and chords. Press **Start** on a lesson card; the lesson marked **Next** is the first one you haven't finished, but nothing is locked. The staff shows a row of notes: the highlighted one is the one to play, played ones turn grey. For a chord, play all its notes in any order. A wrong key counts as a mistake and the target stays until you play it right. At the end you get your accuracy, 1–3 stars, and XP. Random lessons give a new order on every start.
- **Progress:** XP raises your level, and finishing at least one lesson per day builds a daily streak. Everything is saved on your device only; **Reset progress** on Home clears it.

## Install and offline

Piano Tutor is an installable web app (PWA). Open it once online; after that it works without a connection: lessons, free play, sound, progress, and MIDI input.

- **Install:** in Chrome (Android or desktop) Home shows an **Install** card, or use the browser menu / the install icon in the address bar. **Not now** hides the card for good.
- **Updates:** when a new version has been deployed, a banner offers **Reload** or **Later**. The app never reloads by itself, and the banner waits until you leave a lesson. Progress and settings are kept.
- **Dev:** `bun run dev` has no service worker. To try offline mode, use `bun run build && bun run preview`.
- **Icon:** drawn as `public/icon.svg`. After changing it, run `bun run icons` to regenerate the PNG and ICO files, and commit them.

## Scripts

| Script                 | What it does                                |
| ---------------------- | ------------------------------------------- |
| `bun run dev`          | Dev server on http://localhost:3000         |
| `bun run build`        | Type check + production build into `dist/`  |
| `bun run preview`      | Serve the production build locally          |
| `bun run lint`         | TypeScript type check, then ESLint          |
| `bun run format`       | Format all files with Prettier              |
| `bun run format:check` | Fail if any file is not formatted           |
| `bun run test`         | Run unit tests once (Vitest)                |
| `bun run icons`        | Regenerate app icons from `public/icon.svg` |

CI (GitHub Actions) runs `lint`, `format:check`, `build`, and `test` on every pull request and every push to `main`.

## Deployment

The app is a static site, deployed to two hosts so they can be compared (see [specs/phase-03-deployment-device-testing/](specs/phase-03-deployment-device-testing/)). Web MIDI needs HTTPS, which both provide.

| Host                 | URL                                                                                                                                           | How it deploys                                                                                              |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| GitHub Pages         | https://sergshtelmakh.github.io/piano-tutor/                                                                                                  | The `deploy-github-pages` job in `.github/workflows/ci.yml` runs after CI passes on `main`. No PR previews. |
| Cloudflare (Workers) | https://piano-tutor.sh-serg1993.workers.dev/ (branch preview: https://feature-deployment-device-testing-piano-tutor.sh-serg1993.workers.dev/) | Git integration: pushes to `main` update production; every other branch and PR gets a preview URL.          |

The footer of the app shows the commit and host of the running build.

**GitHub Pages setup (once):** repository Settings → Pages → Source: **GitHub Actions**. The build uses `BASE_PATH=/piano-tutor/`.

**Cloudflare setup (once):** Workers & Pages → Create → Pages → Connect to Git → this repository, then:

- Production branch: `main`
- Build command: `bun install --frozen-lockfile && bun run build` (fallback if Bun fails: `npm install && npm run build`)
- Build output directory: `dist`
- Preview command (the branch Previews that Cloudflare creates for every non-production branch): `npx wrangler preview`. A Preview is its own resource, so `npx wrangler versions upload` fails there with "The name in your wrangler.jsonc file must match the name of your Worker". `wrangler preview` is an open beta command and once failed with API error 10013 on the asset upload; a retry fixed it. Check the command on the Preview page of each new branch if it was copied from somewhere else.
- `wrangler.jsonc` in the repo sets the Worker name (`piano-tutor`), the `dist` assets directory and the `previews` block that branch preview builds (`wrangler preview`) require.
- Environment variable `BUN_VERSION`: `1.4.4`
- Leave Web Analytics off (privacy by default).

Cloudflare sets `CF_PAGES*` (Pages) or `WORKERS_CI*` (Workers Builds, which is what the dashboard created: a `workers.dev` URL), which the build reads for the footer. The base path stays `/`.

## Credits

The treble and bass clef shapes on the music staff are outlines from the [Bravura](https://github.com/steinbergmedia/bravura) music font, © Steinberg Media Technologies GmbH, used under the SIL Open Font License 1.1 (see [licenses/Bravura-OFL-1.1.txt](licenses/Bravura-OFL-1.1.txt)).

## Language

The UI is available in English, Ukrainian, German, and French. The first visit follows the browser language (falling back to English); the language selector remembers your choice.

## Development process

This project uses Spec-Driven Development. Specs in [specs/](specs/) are the source of truth — start with [specs/README.md](specs/README.md).
