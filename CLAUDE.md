# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Spec-Driven Development (read first)

This project is built with **Spec-Driven Development (SDD)**. Specs in `specs/` are the source of truth; code follows them. The repository starts from a clean slate, so there is no legacy code to infer intent from — the specs are the intent.

Before any non-trivial change, read the constitution:

- `specs/mission.md` — why, for whom, product principles, scope
- `specs/tech-stack.md` — stack, architecture rules, conventions, quality gates
- `specs/roadmap.md` — phases in order and their status

Workflow (details and example prompts in `specs/README.md`):

1. **Spec** — for a roadmap phase, use the `feature-spec` skill: branch `feature/<slug>`, folder `specs/YYYY-MM-DD-<slug>/` with `plan.md`, `requirements.md`, `validation.md`. Ask clarifying questions first. Stop for human review.
2. **Implement** — work through `plan.md` task groups in order; tick tasks off as you go. Don't add scope that isn't in the spec.
3. **Validate** — run every item in `validation.md`; the feature is done only when all pass.
4. **Replan** — use the `replan` skill: update roadmap, tech stack, changelog, README.

Models: **planning runs on Opus** (steps 1 Spec and 4 Replan); **implementation runs on Sonnet** (steps 2 Implement and 3 Validate). Switch with `/model` before starting each step.

Rules:

- No feature work without a spec. Small fixes (typos, obvious bugs, docs) don't need one.
- If the spec turns out to be wrong, update the spec first, then the code.
- New ideas found mid-feature go to the roadmap Backlog or `specs/backlog/`, not into the current feature.
- Commit spec files together with the code they describe. One roadmap phase = one branch = one PR.
- `specs/tech-stack.md` is currently **proposed**, not final. Phase 1 confirms it; if a choice there is wrong, change the spec first.

## About the project

Piano Tutor is a gamified piano-learning web app: it connects to a MIDI piano via Web MIDI and checks in real time whether the learner plays the right notes. Client-side only, no backend. See `specs/mission.md`.

## Commands

No code exists yet. Phase 1 (project scaffold) introduces the scripts below; update this section when it lands.

```bash
bun run dev        # dev server
bun run build      # production build
bun run lint       # tsc --noEmit
bun run test       # vitest
```

## Language

- Docs, specs, code comments, commit messages, PR descriptions: **English**.
- UI strings: English by default; the user can optionally pick Ukrainian, German, or French. All strings live in one translations module (see `specs/tech-stack.md`).

## Architecture rules (summary — full list in `specs/tech-stack.md`)

- One note-event pipeline: all input sources go through the same entry point.
- Pure core logic (theory, judging, lessons, scoring) with no React/DOM/audio imports.
- Thin UI components; game rules don't live in components.
- No new runtime dependencies without justification in the feature's `plan.md`.
- Web MIDI works only in Chromium and only in a secure context (localhost / HTTPS); every feature must also work with the on-screen/computer keyboard.
