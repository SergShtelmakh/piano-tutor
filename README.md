# Piano Tutor

A gamified piano-learning web app: connect a MIDI keyboard (Web MIDI) and get real-time feedback on whether you play the right notes. Client-side only, no backend. See [specs/mission.md](specs/mission.md).

> Status: free play works (roadmap Phase 2): MIDI keyboard, computer keyboard, and on-screen piano all make sound. Lessons are coming in later phases — see [specs/roadmap.md](specs/roadmap.md).

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
- **Computer keyboard:** `A S D F G H J K L ;` are the white keys (C D E F G A B C D E) and `W E T Y U O P` are the black keys. `Z` / `X` shift the octave down / up. Keys are matched by physical position, so this works on QWERTZ and AZERTY layouts too.
- **On-screen piano:** click or touch the keys. The octave buttons change the shown range (C3–C5 by default).

## Scripts

| Script                 | What it does                               |
| ---------------------- | ------------------------------------------ |
| `bun run dev`          | Dev server on http://localhost:3000        |
| `bun run build`        | Type check + production build into `dist/` |
| `bun run preview`      | Serve the production build locally         |
| `bun run lint`         | TypeScript type check, then ESLint         |
| `bun run format`       | Format all files with Prettier             |
| `bun run format:check` | Fail if any file is not formatted          |
| `bun run test`         | Run unit tests once (Vitest)               |

CI (GitHub Actions) runs `lint`, `format:check`, `build`, and `test` on every pull request and every push to `main`.

## Language

The UI is available in English, Ukrainian, German, and French. The first visit follows the browser language (falling back to English); the language selector remembers your choice.

## Development process

This project uses Spec-Driven Development. Specs in [specs/](specs/) are the source of truth — start with [specs/README.md](specs/README.md).
