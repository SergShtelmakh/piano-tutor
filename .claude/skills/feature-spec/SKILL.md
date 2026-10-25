---
name: feature-spec
description: Create a spec-driven feature spec (plan.md, requirements.md, validation.md) for the next roadmap phase of Piano Tutor. Use when starting a new feature or roadmap phase.
model: opus
---

# Feature spec

Create the spec for one feature before writing any code.

## Steps

1. Read `specs/mission.md`, `specs/tech-stack.md`, `specs/roadmap.md`, and `CLAUDE.md`.
2. Pick the phase: the one the user named, otherwise the first phase marked `📋 planned`.
3. Create a git branch `feature/<slug>` (kebab-case, from the phase title). If git is not available, say so and continue.
4. Ask the user **3–5 clarifying questions** about scope, UX, and edge cases. Wait for answers. Do not guess on decisions that change behavior.
5. Create `specs/phase-NN-<slug>/` (NN = the roadmap phase number, zero-padded) by copying `specs/_templates/plan.md`, `requirements.md`, `validation.md`, and fill them in:
   - `requirements.md`: context, numbered FR-n, non-functional requirements, out of scope, and a **Decisions** table with the user's answers.
   - `plan.md`: approach, numbered **task groups** (small, ordered, reviewable), files touched, new dependencies (default: none).
   - `validation.md`: one manual check per FR-n with concrete steps and expected result, plus the automated gates from `tech-stack.md`.
6. Mark the phase `🔨 in progress` in `specs/roadmap.md` and link the spec folder.
7. Stop. Show a short summary and ask the user to review the spec. **Do not implement** until the user approves.

## Rules

- Respect every rule in `specs/tech-stack.md` (single note pipeline, pure core logic, translations module for UI text, no new deps without justification).
- Keep the feature small: if it needs more than ~5 task groups, propose splitting the phase.
- Write specs in English.
- Planning runs on Opus (set via `model: opus` in this skill's frontmatter); implementation of the approved spec runs on Sonnet.
