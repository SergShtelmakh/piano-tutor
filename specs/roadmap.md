# Roadmap

> Part of the project **constitution**. A living document: **what** we build and **in what order**.
> Each phase becomes one feature spec folder (`specs/YYYY-MM-DD-<slug>/`) and one branch/PR.
> Keep phases small enough to implement and validate in one session. Re-plan between phases.
>
> Status: `✅ done` · `🔨 in progress` · `📋 planned` · `💡 idea (backlog)`
>
> Phase 1 is done. Phases 2–6 are still the original proposal; re-check each one when its spec is written.

## Phase 1 — Project scaffold & quality gates ✅

Goal: an empty but fully working, tested, deployable skeleton.

Spec: [`specs/2026-10-25-project-scaffold/`](2026-10-25-project-scaffold/). Merged in PR #2.

- Vite + React + TypeScript (strict) + Tailwind; Bun scripts `dev`, `build`, `preview`, `lint`, `format`, `format:check`, `test`.
- ESLint + Prettier, Vitest; `.gitignore`.
- GitHub Actions CI running lint, format check, build, and test on every PR and push to `main`.
- In-house translations module with `en` (source, fallback), `uk`, `de`, `fr`; browser-language detection on first visit; a language selector that remembers the choice.
- App shell with a placeholder screen.

## Phase 2 — Input pipeline & on-screen keyboard 📋

Goal: any key press from any source becomes a note event and makes a sound.

- Single note-event pipeline (rule 1 in `tech-stack.md`).
- Web MIDI connection: device list, permission handling, unsupported-browser message.
- Computer-keyboard mapping and clickable/touch on-screen piano keyboard.
- Small Web Audio synth with velocity.
- Unit tests for MIDI message parsing.
- All new UI text (device status, permission and unsupported-browser messages) goes through the translations module, in all four locales.

## Phase 3 — First lesson: play the right notes 📋

Goal: the core promise of the product, end to end.

- Pure lesson model: a sequence of target notes/chords and a judge that decides right / wrong.
- One playable lesson screen: target highlighted on the keyboard (green = right, red = wrong), counters for correct notes and mistakes.
- Completion summary with accuracy.
- Unit tests for the judge and lesson progression.
- Translations: add interpolation and plural forms (needed for "3 mistakes", "85 % accuracy"). This was deferred from Phase 1. Ukrainian has several plural forms, so use `Intl.PluralRules`.

## Phase 4 — Game mechanics & local progress 📋

Goal: a reason to come back tomorrow.

- XP, levels, daily streak; rewards shown on lesson completion.
- Progress saved to `localStorage` (graceful when unavailable).
- Simple progress/home screen with a list of lessons and their stars/best accuracy.

## Phase 5 — Lesson content 📋

Goal: enough content for a real first week.

- Lesson format and a small curriculum (single notes → both hands separately → simple melodies → intervals/chords).
- Unlock order tied to progress.

## Phase 6 — PWA & deployment 📋

- Installable PWA with offline support; Android install hint.
- Deploy pipeline to the chosen static host.

## Backlog 💡

Ideas not yet scheduled — see `specs/backlog/` for notes.

- Load a `.mid` file and play it step by step (custom MIDI parser).
- Chord / interval / key analyzer with a chord dictionary.
- Sheet-music view and falling-notes ("waterfall") view.
- Session recorder with `.mid` export.
- Metronome and tempo-following play-along mode.
- Scales and arpeggio drills; adaptive practice.
- Dark mode / theming.

**Tooling backlog** (small fixes; they don't need a phase, see [`backlog/tooling.md`](backlog/tooling.md)):

- Upgrade to TypeScript 7 once `typescript-eslint` supports it.
- `.gitattributes` to normalise line endings (LF in the repo).
- Component / end-to-end smoke tests (Testing Library or Playwright), so manual browser checks can be automated.
- Pre-commit hooks (format + lint), if missed formatting becomes a recurring problem in CI.
