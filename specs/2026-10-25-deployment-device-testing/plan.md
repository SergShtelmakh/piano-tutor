# Plan — Deployment & device testing

> Roadmap phase: Phase 3 — Deployment & device testing
> Branch: `feature/deployment-device-testing`
> Status: Approved

## Goal

The app is live over HTTPS on GitHub Pages and Cloudflare Pages, so the learner (and we) can open it on any phone, tablet, or computer. A real MIDI keyboard is verified to work on the deployed site on desktop and Android Chrome.

## Approach

**Build config — `config/buildInfo.ts`** (pure, no Node or Vite imports; unit-tested)

- `resolveBuildInfo(env: Record<string, string | undefined>) → { basePath, commit, target }`:
  - `basePath`: `env.BASE_PATH`, normalised to start and end with `/`; default `/`.
  - `target`: `env.DEPLOY_TARGET` if it is `github-pages` / `cloudflare-pages`; else `cloudflare-pages` when `env.CF_PAGES === '1'`; else `local`.
  - `commit`: the first 7 characters of `env.CF_PAGES_COMMIT_SHA ?? env.GITHUB_SHA`; else `dev`.
- It lives outside `src/` because it is build configuration, not domain logic. `tsconfig.node.json` adds `config` to `include`. Vitest finds `config/buildInfo.test.ts` with its default globs.

**`vite.config.ts`**: `const info = resolveBuildInfo(process.env)`; sets `base: info.basePath` and `define: { __BUILD_INFO__: JSON.stringify({ commit, target }) }`. A new `src/env.d.ts` declares `__BUILD_INFO__` for the app. `index.html` has no absolute asset URLs besides the entry script, which Vite rewrites, so nothing else needs to change for the sub-path.

**UI — `src/components/BuildInfo.tsx`** (thin): a small muted `<footer>` line, `{t('buildLabel')} {commit} · {hostName}`. `hostName` is `GitHub Pages` / `Cloudflare Pages` (proper nouns, not translated) or `t('buildLocal')`. Rendered at the bottom of `App.tsx`. New keys `buildLabel`, `buildLocal` in `en` first, then `uk`, `de`, `fr`.

**GitHub Pages — `.github/workflows/ci.yml`**: a second job `deploy-github-pages`, `needs: verify`, `if: github.event_name == 'push' && github.ref == 'refs/heads/main'`, job-level `permissions: { contents: read, pages: write, id-token: write }`, `environment: github-pages`, `concurrency: { group: pages, cancel-in-progress: false }`. Steps: checkout → setup-bun → `bun install --frozen-lockfile` → `bun run build` with `BASE_PATH=/piano-tutor/` and `DEPLOY_TARGET=github-pages` → `actions/upload-pages-artifact` (`path: dist`) → `actions/deploy-pages`. The `verify` job stays as it is. One-time manual step for the user: repo **Settings → Pages → Source: GitHub Actions**.

**Cloudflare Pages** (no code, manual setup by the user, documented in `README.md`): Workers & Pages → Create → Pages → Connect to Git → `SergShtelmakh/piano-tutor`. Production branch `main`; build command `bun install --frozen-lockfile && bun run build`; output directory `dist`; environment variable `BUN_VERSION` set to the local Bun version; previews for all non-production branches. `CF_PAGES` and `CF_PAGES_COMMIT_SHA` are set by Cloudflare, so FR-2 needs no extra variables. Web analytics stays off.

**Real-device MIDI**: no planned code change. Run the checks in `validation.md` (FR-9, FR-10) on the deployed site. Fix any bug found in `src/input/midiAccess.ts` / `src/core/*` (FR-11), with a test for pure-logic fixes, and record results in `specs/backlog/midi-device-check.md`.

## Task groups

1. **Base path and build info**
   - [x] `config/buildInfo.ts` + `config/buildInfo.test.ts`: defaults (local, `/`, `dev`), `BASE_PATH` normalisation (`piano-tutor` → `/piano-tutor/`), GitHub env (`GITHUB_SHA` + `DEPLOY_TARGET`), Cloudflare env (`CF_PAGES=1` + `CF_PAGES_COMMIT_SHA`), unknown `DEPLOY_TARGET` → falls back
   - [x] `tsconfig.node.json` includes `config`; `vite.config.ts` uses `base` and `define`; `src/env.d.ts` declares `__BUILD_INFO__`
   - [x] `src/components/BuildInfo.tsx` in `App.tsx`; keys `buildLabel`, `buildLocal` in `en`, `uk`, `de`, `fr`
   - [x] Check locally: `BASE_PATH=/piano-tutor/ bun run build && bun run preview` → the app loads under `/piano-tutor/` with no 404s
2. **GitHub Pages deploy**
   - [x] `deploy-github-pages` job in `ci.yml` as in Approach
   - [ ] User enables Pages with source "GitHub Actions"
   - [ ] After merge (or a test push to `main`): the job runs after `verify`, the site loads, the footer shows the commit (FR-4, FR-5)
3. **Cloudflare Pages**
   - [x] User creates the Pages project with the documented settings
   - [x] This branch gets a preview URL that works; after merge, production updates (FR-6, FR-7)
   - [x] `README.md`: live URLs, how each host deploys, Cloudflare settings (FR-8)
4. **Real-device MIDI checks**
   - [ ] Desktop Chrome on the deployed site: FR-9 checks
   - [ ] Android Chrome + USB-OTG: FR-10 checks
   - [ ] Fix any bug found, with tests (FR-11); update `specs/backlog/midi-device-check.md`
5. **Host comparison**
   - [ ] `hosting-comparison.md` with the measurements from FR-12
   - [ ] User picks the host(s); if one is dropped, remove its deploy (workflow job, or disconnect the Cloudflare project) and its README lines

Groups 2 and 3 can only be fully checked after the PR is merged to `main` (production deploys). The Cloudflare preview for this branch can be checked before that. Groups 4 and 5 need both sites live, so the phase is finished with follow-up commits on `main`-deployed builds; see Risks.

## Files touched

| File                                                               | Change                                      |
| ------------------------------------------------------------------ | ------------------------------------------- |
| `config/buildInfo.ts`, `config/buildInfo.test.ts`                  | New: pure build-info resolver and tests     |
| `vite.config.ts`                                                   | `base` and `define` from `resolveBuildInfo` |
| `tsconfig.node.json`                                               | Include `config`                            |
| `src/env.d.ts`                                                     | New: declare `__BUILD_INFO__`               |
| `src/components/BuildInfo.tsx`                                     | New: footer line                            |
| `src/App.tsx`                                                      | Render the footer                           |
| `src/i18n/locales/{en,uk,de,fr}.ts`                                | `buildLabel`, `buildLocal`                  |
| `.github/workflows/ci.yml`                                         | `deploy-github-pages` job                   |
| `README.md`                                                        | Live URLs, deployment section               |
| `specs/backlog/midi-device-check.md`                               | Results; closed when all pass               |
| `specs/2026-10-25-deployment-device-testing/hosting-comparison.md` | New: comparison                             |
| `src/input/midiAccess.ts`, `src/core/*`                            | Only if FR-9 / FR-10 find bugs              |

## New dependencies

None. The GitHub Actions used (`actions/upload-pages-artifact`, `actions/deploy-pages`) are CI steps, not packages.

## Risks & open questions

- **The phase can't finish until the MIDI device connects** (decision: required). In Phase 2 the piano was not seen by the PC at all, which may be a cable / driver / USB-mode problem unrelated to the app. If that is still the case, the phase stays open. A virtual device (loopMIDI + VMPK) can be used to debug in the meantime, but it does not count for FR-9 / FR-10.
- **One branch = one PR vs. checks after merge:** production deploys and the MIDI checks on the production URLs happen after the PR is merged. Option: do the MIDI checks on the Cloudflare **preview** URL of this branch (it is HTTPS), so they can finish before merge. Only the GitHub Pages production check (FR-5) then needs `main`. Proposed: use the preview for FR-9 / FR-10 / FR-12 measurements, and check FR-4 / FR-5 right after merge, before replan is merged. Replan runs on this branch before merge (CLAUDE.md), so FR-5 may need a short follow-up note.
- **Bun on Cloudflare's build image:** Cloudflare detects Bun from the lockfile, but support for the text `bun.lock` format and the Bun version should be checked on the first build. Fallback: build command `npm install && npm run build` (npm also works per tech-stack).
- **Repo name in the base path:** `/piano-tutor/` is hard-coded in the workflow. Renaming the repo would break it; acceptable for now.
- **Security:** the local `origin` remote URL has a GitHub token in it (`https://ghp_…@github.com/…`). It isn't in the repo, but it is stored in plain text in `.git/config`. Not part of this phase. The user should switch to a credential helper and revoke the token.
