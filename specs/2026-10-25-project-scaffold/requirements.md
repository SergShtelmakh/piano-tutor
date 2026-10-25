# Requirements — Project scaffold & quality gates

## Context

Roadmap Phase 1. The repository has specs but no code. This phase delivers an empty but fully working, tested, deployable-ready skeleton. It also confirms the stack proposed in `specs/tech-stack.md`. Every later phase builds on what is set up here: tooling, quality gates, CI, the translations module, and the app shell.

The answers to the planning questions are in the **Decisions** table below. Two of them change `tech-stack.md`: the first-visit language is now detected from the browser, and ESLint + Prettier are added. `tech-stack.md` was updated in the same change.

## Functional requirements

- **FR-1** The project must be a Vite + React + TypeScript (`strict`) + Tailwind CSS app with these package scripts: `dev`, `build`, `preview`, `lint`, `format`, `format:check`, `test`. The scripts must work with Bun and with npm.
- **FR-2** `dev` must serve the app on **http://localhost:3000**.
- **FR-3** `lint` must run the TypeScript type check (`tsc`, no emit) and then ESLint (flat config, `typescript-eslint`, React Hooks rules). It must fail on any type error or lint error.
- **FR-4** Prettier must be configured. `format` rewrites files and `format:check` fails if any file is not formatted. ESLint must not conflict with Prettier on formatting rules.
- **FR-5** `test` must run Vitest once (not in watch mode). The suite must include one sample test and the unit tests for the translations logic (FR-7, FR-8).
- **FR-6** A GitHub Actions workflow must run on every pull request and on every push to `main`. It installs dependencies with Bun from the lockfile, then runs `lint`, `format:check`, `build`, and `test`. The workflow fails if any step fails.
- **FR-7** A translations module must provide the locales `en`, `uk`, `de`, and `fr`:
  - `en` is the source of truth. The type of the translation keys comes from `en`, so using an unknown key is a type error.
  - Other locales may omit keys. A missing key falls back to the `en` string.
  - Components get strings only through the module (a `useT()`-style hook that returns `t(key)`). No hard-coded UI strings in components.
- **FR-8** The initial language must be chosen in this order:
  1. A valid language saved in `localStorage`.
  2. Otherwise, the first entry in `navigator.languages` (or `navigator.language`) whose primary subtag is `uk`, `de`, `fr`, or `en`. For example, `de-AT` → `de` and `uk-UA` → `uk`.
  3. Otherwise, `en`.
     The selection logic must be a pure function, with no DOM or React imports, and must be unit-tested.
- **FR-9** A language selector must list each language by its own name (English, Українська, Deutsch, Français):
  - Picking a language updates all visible text immediately, without a reload.
  - The choice is saved to `localStorage` and still applies after a reload.
  - If `localStorage` is unavailable or throws, the app still works and switching languages still works for the current session.
- **FR-10** When the language changes, the app must update `<html lang>` and the document title to the current language.
- **FR-11** The app shell must show a placeholder screen with the app name, a one-line tagline, a short "coming soon" message, and the language selector. It must be styled with Tailwind and usable at phone width (no horizontal scroll at 360 px).
- **FR-12** The repository must have a `.gitignore` that covers `node_modules`, build output, coverage, logs, editor/OS files, and local env files.

## Non-functional requirements

- All user-facing text goes through the translations module. Every key has `en` text, and `uk`, `de`, and `fr` translations are provided for every key in this phase.
- No keyboard/MIDI input in this phase, so the "works without MIDI" rule is satisfied by default. The language selector must be usable with the keyboard alone (native `<select>` or equivalent).
- Translations logic (detection, fallback) lives in plain TS with no React, DOM, or `localStorage` imports. Storage and `navigator` access are thin wrappers around it.
- `localStorage` access is wrapped in try/catch.
- Runtime dependencies are only `react` and `react-dom`. Everything else is a dev dependency.

## Out of scope

- Note pipeline, MIDI, audio, keyboard UI (Phase 2).
- PWA, service worker, deployment, choice of hosting (now Phase 3 for deployment, Phase 7 for the PWA).
- Routing, state-management libraries, component libraries.
- Plurals or interpolation in translations, added when a later phase needs them.
- Pre-commit hooks (husky/lint-staged).
- Dark mode / theming beyond a sensible default.

## Decisions

| Question                    | Decision                                                                                                                                        | Reason                                                                                      |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Package manager             | **Bun** stays primary. The user installs Bun locally. CI uses `oven-sh/setup-bun`. Scripts are plain `package.json` scripts, so npm also works. | Keeps the tech-stack choice.                                                                |
| Translations implementation | **In-house tiny module**: typed `t(key)` + React context, locales as TS objects, `en` defines the key type.                                     | No new runtime dependency (tech-stack rules 5–6). Plurals/interpolation aren't needed yet.  |
| First-visit language        | **Detect from browser** (`navigator.languages`, primary subtag matched against `uk`/`de`/`fr`/`en`), else English. A saved choice always wins.  | User preference. `tech-stack.md` updated: English remains the source and fallback language. |
| Code-quality tooling        | **ESLint + Prettier** in addition to `tsc`. `lint` = tsc + ESLint. Prettier is checked by `format:check` in CI.                                 | User preference. `tech-stack.md` quality gates updated.                                     |
| Dev server port             | **3000**                                                                                                                                        | Matches the validation template URL.                                                        |
