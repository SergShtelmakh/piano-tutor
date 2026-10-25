# Specs — Spec-Driven Development

This folder is the source of truth for **what** we build and **why**. Code follows the specs, not the other way around.

```
specs/
├── mission.md        # constitution: why & for whom
├── tech-stack.md     # constitution: how it's built, rules, quality gates
├── roadmap.md        # constitution: phases in implementation order (living)
├── _templates/       # plan.md, requirements.md, validation.md
├── backlog/          # research notes and ideas not yet on the roadmap
└── phase-NN-<slug>/  # one folder per feature (= one roadmap phase)
    ├── plan.md
    ├── requirements.md
    └── validation.md
```

## Workflow

```
Constitution (once, then evolves)
  mission.md · tech-stack.md · roadmap.md
        │
        ▼
Feature loop (per roadmap phase)
  1. Spec      → branch feature/<slug>, folder specs/phase-NN-<slug>/,
                 agent asks clarifying questions, writes plan / requirements / validation
                 → human reviews and edits the spec
  2. Implement → agent works through plan.md task groups, one at a time
  3. Validate  → run every check in validation.md; fix until all pass
        │
        ▼
Replan (between features)
  update roadmap.md (status, new/moved phases), tech-stack.md, mission.md if needed
  → merge branch → next phase
```

### Which model for which step

| Step         | Model                       |
| ------------ | --------------------------- |
| 1. Spec      | **Opus** (planning)         |
| 2. Implement | **Sonnet** (implementation) |
| 3. Validate  | **Sonnet**                  |
| 4. Replan    | **Opus** (planning)         |

Switch with `/model` before starting each step.

### Example prompts

**1. Spec**

> Use the `feature-spec` skill. Find the next 📋 phase in `specs/roadmap.md`, create a branch, and write the feature spec. Ask me clarifying questions first. Use `specs/mission.md` and `specs/tech-stack.md` as guidance.

**2. Implement**

> Implement `specs/<folder>/plan.md`, task group 1 only. Then stop for review.

**3. Validate**

> Run `specs/<folder>/validation.md`. Report each item as pass/fail and fix failures.

**4. Replan**

> Use the `replan` skill: update the roadmap after this feature, and suggest changes to the constitution.

### Rules of thumb

- Small spec change → regenerate code; don't hand-patch around the spec.
- If implementation reveals the spec was wrong, **fix the spec first**, then the code.
- Large new idea mid-feature → add it to `roadmap.md` or `backlog/`, don't expand the current spec.
- Spec files are committed together with the code they describe.
