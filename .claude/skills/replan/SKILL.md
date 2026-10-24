---
name: replan
description: After a Piano Tutor feature is validated, update the SDD constitution (roadmap, tech stack, mission) and changelog before starting the next phase. Use between features.
model: opus
---

# Replan

Run after a feature's `validation.md` is fully checked.

## Steps

1. Read the finished feature folder `specs/YYYY-MM-DD-<slug>/` and the diff of the branch.
2. `specs/roadmap.md`: mark the phase `✅ done`, link its spec folder. Move, split, or add phases based on what was learned. Move ideas that came up to **Backlog** (or a note in `specs/backlog/`).
3. `specs/tech-stack.md`: update if dependencies, rules, quality gates, or known technical debt changed.
4. `specs/mission.md`: propose changes only if scope or principles changed — ask before editing.
5. `CHANGELOG.md`: add a user-facing entry under today's date (create the file if missing; Keep a Changelog style).
6. Update `README.md` if user-visible features changed, and `CLAUDE.md` if agent guidance changed.
7. Summarize the changes and propose the next phase. Do not start it without the user.

## Rules

- Planning runs on Opus (set via `model: opus` in this skill's frontmatter); the next phase's implementation runs on Sonnet.
