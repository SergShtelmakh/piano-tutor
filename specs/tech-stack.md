# Tech Stack

> Part of the project **constitution**. This file answers **how it is built** and lists the technical rules every feature spec must respect.
> Status: **proposed** — nothing is built yet. Confirm or change each choice before Phase 1 starts; this file is the single place where those decisions are recorded.

## Stack (proposed)

| Area            | Choice                                                                                                                   | Why                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| App type        | Client-side SPA, installable PWA, **no backend**                                                                         | Zero friction, privacy by default (see mission).                                             |
| Language        | TypeScript, `strict` mode                                                                                                | Safer refactors for agent-written code.                                                      |
| UI              | React (latest stable), functional components                                                                             | Large ecosystem, good agent support.                                                         |
| Build / dev     | Vite                                                                                                                     | Fast dev loop, simple static output.                                                         |
| Styling         | Tailwind CSS                                                                                                             | Utility classes in `className`, no separate CSS files per component.                         |
| Input           | Web MIDI API + computer keyboard + pointer/touch                                                                         | Hardware optional (mission principle 4).                                                     |
| Audio           | Web Audio API (small in-house synth)                                                                                     | No sample downloads, works offline.                                                          |
| Persistence     | `localStorage` (wrapped in try/catch)                                                                                    | Local-only progress; revisit if sync is ever in scope.                                       |
| PWA             | `vite-plugin-pwa`                                                                                                        | Installable, offline-capable.                                                                |
| Unit tests      | Vitest                                                                                                                   | Same toolchain as Vite.                                                                      |
| Lint / format   | ESLint (flat config, `typescript-eslint`, React Hooks) + Prettier                                                        | Consistent style for agent-written code; dev-only.                                           |
| Package manager | Bun (npm must also work)                                                                                                 |                                                                                              |
| Target browsers | Chromium-based desktop + Chrome on Android                                                                               | Web MIDI is not available in Safari/Firefox; those fall back to on-screen/computer keyboard. |
| Hosting         | Static hosting over HTTPS (required for Web MIDI and service workers) — _TBD: GitHub Pages / Netlify / Cloudflare Pages_ |                                                                                              |

## Architecture rules

1. **One note pipeline:** every input source (MIDI, computer keyboard, on-screen keyboard, playback) emits the same note-on / note-off events into a single entry point. Sound, judging, and recording subscribe to it; nothing reads a device directly.
2. **Pure core:** music theory, note judging, lesson logic, and scoring live in plain TypeScript modules with **no React, DOM, or audio imports** so they are unit-testable.
3. **Thin UI:** components render state and forward events; they don't contain game rules.
4. **Shared types** live in one module; changing them requires checking every consumer.
5. **No new runtime dependencies** without a line in the feature's `plan.md` explaining why existing code can't do it.
6. Prefer small, dependency-free code for domain logic (e.g. a MIDI file parser) over heavy libraries.

## Conventions

- Docs, specs, code comments, commit messages, PR descriptions: **English**.
- UI language: **English** is the source and fallback language; the app also ships **Ukrainian, German, and French**. On first visit the language is detected from the browser (`navigator.languages`, primary subtag matched against `uk`/`de`/`fr`/`en`), otherwise English; a language the user picked always wins. All user-facing strings go through one in-house translations module with a locale per language (`en`, `uk`, `de`, `fr`); `en` defines the key type and is the fallback for any missing key. The chosen language is stored in `localStorage` (wrapped in try/catch). No hard-coded UI strings in components.
- Branches: `feature/<slug>`; one roadmap phase = one branch = one PR.
- Commits are small and reference the spec folder.

## Quality gates

| Gate                                                | Command                                                        | Introduced in |
| --------------------------------------------------- | -------------------------------------------------------------- | ------------- |
| Type check + lint                                   | `bun run lint` (`tsc` no-emit, then ESLint)                    | Phase 1       |
| Formatting                                          | `bun run format:check` (Prettier)                              | Phase 1       |
| Production build                                    | `bun run build`                                                | Phase 1       |
| Unit tests                                          | `bun run test`                                                 | Phase 1       |
| CI (lint + format check + build + test on every PR) | GitHub Actions                                                 | Phase 1       |
| Manual check                                        | `bun run dev`, try the changed flow with the computer keyboard | always        |

A phase is done only when all gates that exist at that point pass and its `validation.md` is fully checked.
