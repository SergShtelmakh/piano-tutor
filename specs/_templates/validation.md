# Validation — <Feature name>

The feature is done (and the branch can be merged) only when every box is checked.

## Automated

- [ ] `bun run lint` passes
- [ ] `bun run build` passes
- [ ] `bun run test` passes — new/changed pure logic has unit tests

## Manual checks

Run `bun run dev`, open http://localhost:3000 in Chrome.

- [ ] FR-1: <step-by-step check and expected result>
- [ ] FR-2: …
- [ ] Works with computer keyboard (`Q W E R…`) without a MIDI device
- [ ] No console errors
- [ ] User-facing text comes from the translations module, with keys in all locales (`en`, `uk`, `de`, `fr`)

## Constitution follow-up

- [ ] `specs/roadmap.md` — phase status updated
- [ ] `specs/tech-stack.md` — updated if stack/rules changed
- [ ] `CHANGELOG.md` / README updated if user-visible
