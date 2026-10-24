# Plan — Project scaffold & quality gates

> Roadmap phase: Phase 1 — Project scaffold & quality gates
> Branch: `feature/project-scaffold`
> Status: Validated

## Goal

The repository becomes a working app: `bun run dev` opens a translated placeholder screen with a language selector. Type check, lint, format check, build, and tests all pass locally and in CI on every PR.

## Approach

- Scaffold by hand, guided by the official Vite `react-ts` template, rather than running a generator into a non-empty repo. Keep only what we use.
- Tailwind CSS v4 through `@tailwindcss/vite`. One global stylesheet, `src/index.css`, that only imports Tailwind.
- TypeScript `strict`. `lint` = `tsc -b --noEmit`-style type check of app + config, then `eslint .`.
- ESLint flat config: `@eslint/js` recommended + `typescript-eslint` recommended + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh`, with `eslint-config-prettier` last so formatting is left to Prettier.
- Vitest configured in `vite.config.ts` (`test` block, `node` environment). This phase has only pure-logic tests, so no jsdom or Testing Library yet.
- Translations module in `src/i18n/`, split so the core stays pure:
  - `locales/en.ts`: source object, `as const`. `type TranslationKey = keyof typeof en`.
  - `locales/uk.ts`, `de.ts`, `fr.ts`: typed `Partial<Record<TranslationKey, string>>`.
  - `core.ts` (pure): `SUPPORTED_LOCALES`, `LOCALE_NAMES` (native names), `isLocale()`, `resolveInitialLocale(saved, browserLanguages)`, `translate(locale, key)` with `en` fallback.
  - `storage.ts`: `loadLocale()` / `saveLocale()` around `localStorage`, each in try/catch.
  - `I18nProvider.tsx` + `useT()` / `useLocale()`: React context. Reads storage + `navigator.languages` once on startup, saves on change, and syncs `<html lang>` and `document.title`.
- `src/App.tsx` renders the placeholder screen. `src/components/LanguageSelector.tsx` is a native `<select>` (keyboard-accessible). Both get all text from `useT()`.
- CI: `.github/workflows/ci.yml`, triggered on `pull_request` and `push` to `main`. Steps: checkout → `oven-sh/setup-bun` → `bun install --frozen-lockfile` → `bun run lint` → `bun run format:check` → `bun run build` → `bun run test`.

## Task groups

1. **Tooling scaffold**
   - [x] `package.json` (name, `type: module`, scripts: `dev`, `build`, `preview`, `lint`, `format`, `format:check`, `test`), install deps with Bun, commit `bun.lock`
   - [x] `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` with `strict`
   - [x] `vite.config.ts`: React plugin, Tailwind plugin, `server.port = 3000` (`strictPort`), Vitest `test` block
   - [x] `index.html`, `src/main.tsx`, `src/index.css` (Tailwind import), minimal `src/App.tsx`
   - [x] `.gitignore`
   - [x] Verify: `bun run dev` serves on :3000 and `bun run build` succeeds
2. **Lint, format, test gates**
   - [x] `eslint.config.js` (flat config as in Approach), `lint` script = type check + ESLint
   - [x] `.prettierrc` + `.prettierignore`, `format` / `format:check` scripts, run `format` once over the repo
   - [x] Sample Vitest test (`src/sample.test.ts`), `test` = `vitest run`
   - [x] Verify: all four gates pass locally
3. **Translations module (pure core + tests)**
   - [x] `src/i18n/locales/en.ts` with the keys for this phase (app name, tagline, coming-soon text, language label, document title), plus `uk.ts`, `de.ts`, `fr.ts` with all keys translated
   - [x] `src/i18n/core.ts`: `SUPPORTED_LOCALES`, `LOCALE_NAMES`, `isLocale`, `resolveInitialLocale`, `translate`
   - [x] `src/i18n/core.test.ts`: saved valid locale wins, invalid saved value ignored, region subtags (`de-AT`, `uk-UA`), first match in list order, unsupported → `en`, empty list → `en`, missing key falls back to `en`
   - [x] `src/i18n/storage.ts` with try/catch wrappers
4. **App shell & language selector**
   - [x] `src/i18n/I18nProvider.tsx` with `useT()` / `useLocale()`; syncs `<html lang>` and `document.title`
   - [x] `src/components/LanguageSelector.tsx` (native `<select>`, native language names, accessible label from translations)
   - [x] `src/App.tsx` placeholder screen (name, tagline, coming-soon, selector), responsive Tailwind layout
   - [x] Verify: switching language updates text, title, and `lang` instantly; a reload keeps the choice; the app still works with storage blocked
5. **CI & docs**
   - [x] `.github/workflows/ci.yml` as in Approach
   - [x] Update `CLAUDE.md` Commands section (real scripts, incl. `format`, `format:check`, Bun install note)
   - [x] `README.md`: prerequisites (Bun, Chromium), setup, scripts
   - [x] Run every item in `validation.md`

## Files touched

| File                                                                                            | Change                                                          |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `package.json`, `bun.lock`                                                                      | new                                                             |
| `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`                                      | new                                                             |
| `vite.config.ts`                                                                                | new: React, Tailwind, port 3000, Vitest                         |
| `eslint.config.js`, `.prettierrc`, `.prettierignore`                                            | new                                                             |
| `.gitignore`                                                                                    | new                                                             |
| `index.html`, `src/main.tsx`, `src/index.css`, `src/App.tsx`                                    | new                                                             |
| `src/sample.test.ts`                                                                            | new                                                             |
| `src/i18n/core.ts`, `src/i18n/core.test.ts`, `src/i18n/storage.ts`, `src/i18n/I18nProvider.tsx` | new                                                             |
| `src/i18n/locales/{en,uk,de,fr}.ts`                                                             | new                                                             |
| `src/components/LanguageSelector.tsx`                                                           | new                                                             |
| `.github/workflows/ci.yml`                                                                      | new                                                             |
| `CLAUDE.md`, `README.md`                                                                        | update commands / setup                                         |
| `specs/tech-stack.md`                                                                           | updated during planning (language detection, ESLint + Prettier) |

## New dependencies

Everything is listed in `tech-stack.md` or is standard tooling for it. Only `react` / `react-dom` ship to users.

| Package                                                                                                            | Kind    | Why                                                                  |
| ------------------------------------------------------------------------------------------------------------------ | ------- | -------------------------------------------------------------------- |
| `react`, `react-dom`                                                                                               | runtime | UI framework (tech-stack)                                            |
| `vite`, `@vitejs/plugin-react`                                                                                     | dev     | Build / dev server (tech-stack)                                      |
| `typescript`, `@types/react`, `@types/react-dom`                                                                   | dev     | Language (tech-stack)                                                |
| `tailwindcss`, `@tailwindcss/vite`                                                                                 | dev     | Styling (tech-stack)                                                 |
| `vitest`                                                                                                           | dev     | Unit tests (tech-stack)                                              |
| `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals` | dev     | Linting (Decision: ESLint)                                           |
| `prettier`, `eslint-config-prettier`                                                                               | dev     | Formatting, and stops ESLint/Prettier conflicts (Decision: Prettier) |

## Risks & open questions

- **Implementation note:** `typescript` is pinned to `^6` because `typescript-eslint` does not yet support TypeScript 7 (tracked in typescript-eslint#10940). `@types/node` is also added as a dev dependency for typing `vite.config.ts`. Revisit the TypeScript pin when typescript-eslint supports 7.

- **Bun must be installed locally** before task group 1. On Windows: `powershell -c "irm bun.sh/install.ps1 | iex"`.
- Locale translations (uk/de/fr) are written by the agent. The user should skim them for a natural tone.
- Exact package versions are picked at install time (latest stable) and pinned by `bun.lock`.
- Hosting stays TBD until Phase 6. CI here only verifies and does not deploy.
