# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Spec-Driven Development (read first)

This project is built with **Spec-Driven Development (SDD)**. Specs in `specs/` are the source of truth; code follows them. The repository starts from a clean slate, so there is no legacy code to infer intent from — the specs are the intent.

Before any non-trivial change, read the constitution:

- `specs/mission.md` — why, for whom, product principles, scope
- `specs/tech-stack.md` — stack, architecture rules, conventions, quality gates
- `specs/roadmap.md` — phases in order and their status

Workflow (details and example prompts in `specs/README.md`):

1. **Spec** — for a roadmap phase, use the `feature-spec` skill: branch `feature/<slug>`, folder `specs/phase-NN-<slug>/` with `plan.md`, `requirements.md`, `validation.md`. Ask clarifying questions first. Stop for human review.
2. **Implement** — work through `plan.md` task groups in order; tick tasks off as you go. Don't add scope that isn't in the spec.
3. **Validate** — run every item in `validation.md`; the feature is done only when all pass.
4. **Replan** — use the `replan` skill: update roadmap, tech stack, changelog, README. Run it on the feature branch **before** the PR is merged, so the phase stays one branch = one PR.

Models: **planning runs on Opus** (steps 1 Spec and 4 Replan); **implementation runs on Sonnet** (steps 2 Implement and 3 Validate). Switch with `/model` before starting each step.

Rules:

- No feature work without a spec. Small fixes (typos, obvious bugs, docs) don't need one.
- If the spec turns out to be wrong, update the spec first, then the code.
- New ideas found mid-feature go to the roadmap Backlog or `specs/backlog/`, not into the current feature.
- Commit spec files together with the code they describe. One roadmap phase = one branch = one PR.
- `specs/tech-stack.md` is **confirmed** (Phase 1). If a choice there turns out wrong, change the spec first. Check its "Known technical debt" section before touching tooling.
- Translations for `uk`, `de`, `fr` are written by the agent. Ask the user to skim new strings during validation.

## About the project

Piano Tutor is a gamified piano-learning web app: it connects to a MIDI piano via Web MIDI and checks in real time whether the learner plays the right notes. Client-side only, no backend. See `specs/mission.md`.

## Commands

Bun is the primary package manager (npm also works). On Windows, Bun may not be on PATH: `$env:Path += ";$env:USERPROFILE\.bun\bin"`.

Don't rewrite files with Windows PowerShell `Get-Content` / `Set-Content`: it reads UTF-8 as the system code page and corrupts non-ASCII text (`→`, `♯`, Cyrillic). This happened in Phase 2. Use the Edit tool, or Bash `sed`.

```bash
bun install
bun run dev            # dev server on http://localhost:3000
bun run build          # tsc -b + production build
bun run lint           # tsc -b (type check) + eslint
bun run format         # prettier --write
bun run format:check   # prettier --check (run in CI)
bun run test           # vitest run (once)
```

The service worker exists only in production builds: to check offline mode, install, or updates, use `bun run build && bun run preview` (http://localhost:4173), not `dev`. For the GitHub Pages base, set `BASE_PATH=/piano-tutor/` (the app is then at `/piano-tutor/`). In Git Bash prefix it with `MSYS_NO_PATHCONV=1`, or the path is rewritten to `C:/Program Files/Git/...`. Unset it afterwards in PowerShell (`Remove-Item Env:BASE_PATH`).

Note: `typescript` is pinned to `^6` until `typescript-eslint` supports TypeScript 7.

## Library content policy

The Player's library (`public/library/`, catalogue in `src/core/libraryCatalog.ts`) has a fixed licence policy, decided by the user. Don't relax it without being asked:

- MIDI pieces only from the [Mutopia Project](https://www.mutopiaproject.org/), and only if the piece's **own page** says Public Domain (Mutopia's list filter is unreliable: it also shows CC-BY and CC-BY-SA). Never CC-BY, CC-BY-SA, or files from other sites.
- Composer portraits only from Wikimedia Commons images that are marked Public domain (or CC0).
- No composers of Russian origin.
- Record the source, licence, and check date of everything in the catalogue and in `licenses/library-sources.md`; the tests enforce the allowlists. See "Library" in the README for how to add a piece.

## Language

- Docs, specs, code comments, commit messages, PR descriptions: **English**.
- UI strings: English is the source and fallback; Ukrainian, German, and French are also shipped, and the first-visit language follows the browser. All strings live in `src/i18n/` (add keys to `locales/en.ts` first, then the other locales). See `specs/tech-stack.md`.

## Architecture rules (summary — full list in `specs/tech-stack.md`)

- One note-event pipeline: all input sources go through the same entry point.
- Pure core logic (theory, judging, lessons, scoring) with no React/DOM/audio imports.
- Thin UI components; game rules don't live in components.
- No new runtime dependencies without justification in the feature's `plan.md`.
- Web MIDI works only in Chromium and only in a secure context (localhost / HTTPS); every feature must also work with the on-screen/computer keyboard.
