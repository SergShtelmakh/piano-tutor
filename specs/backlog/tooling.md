# Tooling backlog

Found during Phase 1 (`specs/2026-10-25-project-scaffold/`). Each item is a small fix and doesn't need its own roadmap phase.

## TypeScript 7

- **Problem:** `typescript-eslint` 8.x refuses to run with TypeScript 7, so `typescript` is pinned to `^6`.
- **Idea:** Upgrade when typescript-eslint supports TS 7 (tracked in typescript-eslint#10940). The native `tsc` is much faster.
- **Check:** `bun add -d typescript@latest && bun run lint`.

## Line endings

- **Problem:** On Windows, git warns "LF will be replaced by CRLF" for every file. Prettier uses `endOfLine: "auto"` to avoid false `format:check` failures.
- **Idea:** Add `.gitattributes` with `* text=auto eol=lf`, switch Prettier to `endOfLine: "lf"`, and renormalise once (`git add --renormalize .`).

## Automated UI checks

- **Problem:** Language switching, `<html lang>`, storage-blocked behaviour, and layout at 360 px were checked by hand in Phase 1. These checks will grow with every phase.
- **Idea:** Add Vitest + jsdom + Testing Library for component behaviour, and/or one Playwright smoke test in CI.
- **Open question:** Is that worth a new dev dependency now, or only when Phase 2/3 adds interactive UI?

## Pre-commit hooks

- **Idea:** Run `format` and `lint` on staged files (husky + lint-staged, or a plain git hook).
- **When:** Only if CI keeps failing on formatting. CI already enforces `format:check`.
