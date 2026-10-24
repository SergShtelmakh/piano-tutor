# piano-tutor

Gamified piano learning web app: connects to your piano via Web MIDI and checks whether you play the right notes.

> **Status:** early planning. The repository starts from a clean slate and is developed with Spec-Driven Development — no application code yet; the first phase is the project scaffold.

## Vision

Plug in a digital piano or MIDI keyboard, open the page, and play short, rewarding challenges. The app judges every note instantly, and game mechanics (XP, streaks, levels) keep practice fun. No account, no backend — everything runs in the browser. Details: [`specs/mission.md`](specs/mission.md).

## Planned features

- Real-time note checking via Web MIDI (with on-screen / computer-keyboard fallback)
- Guided lessons with green / red key feedback
- XP, levels, and daily streaks with local progress
- Installable PWA that works offline

See [`specs/roadmap.md`](specs/roadmap.md) for phases and status.

## Development process (Spec-Driven Development)

Every feature starts as a Markdown spec that a coding agent implements and validates.

- **Constitution** — [`specs/mission.md`](specs/mission.md) (why & for whom), [`specs/tech-stack.md`](specs/tech-stack.md) (how it's built, rules, quality gates), [`specs/roadmap.md`](specs/roadmap.md) (phases and status).
- **Feature loop** — for each roadmap phase: spec (`plan.md`, `requirements.md`, `validation.md` in `specs/YYYY-MM-DD-<slug>/`) → implement → validate → replan.
- **Agent skills** — `.claude/skills/feature-spec` creates a spec for the next phase; `.claude/skills/replan` updates the roadmap and docs after a feature.

See [`specs/README.md`](specs/README.md) for the workflow and example prompts, and [`CLAUDE.md`](CLAUDE.md) for agent guidance.

## Repository layout

```
specs/                 # SDD: constitution, templates, backlog, feature specs
.claude/skills/        # agent skills: feature-spec, replan
CLAUDE.md              # guidance for coding agents
```

Application source will appear after Phase 1.

## License

[MIT](LICENSE)
