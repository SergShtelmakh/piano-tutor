# Validation — Project scaffold & quality gates

The feature is done (and the branch can be merged) only when every box is checked.

## Automated

- [x] `bun run lint` passes (type check + ESLint)
- [x] `bun run format:check` passes
- [x] `bun run build` passes
- [x] `bun run test` passes: sample test + `src/i18n/core.test.ts`
- [x] Same scripts work with npm: `npm install && npm run lint && npm run build && npm run test`

## Manual checks

Run `bun run dev` and open http://localhost:3000 in Chrome.

- [x] FR-1: `package.json` has the scripts `dev`, `build`, `preview`, `lint`, `format`, `format:check`, `test`. `tsconfig` has `"strict": true`. A Tailwind utility class visibly styles the page.
- [x] FR-2: The dev server prints `http://localhost:3000` and the page loads there.
- [x] FR-3: Add `const x: number = "a";` to `src/App.tsx` → `bun run lint` fails with a type error. Revert. Add an unused variable → `bun run lint` fails with an ESLint error. Revert.
- [x] FR-4: Mess up the indentation in `src/App.tsx` → `bun run format:check` fails. Then `bun run format` fixes it and `format:check` passes.
- [x] FR-5: `bun run test` runs once and exits (no watch mode). The output lists the sample test and the i18n tests.
- [ ] FR-6: Open a PR from this branch → the GitHub Actions "CI" workflow runs lint, format:check, build, and test, and passes. (Optional: push a commit with a type error to a scratch branch → CI fails.)
- [x] FR-7: Delete one key from `src/i18n/locales/de.ts` → `bun run lint` still passes, and with German selected that string shows in English. Restore it. Use a non-existent key in `App.tsx` → `bun run lint` fails. Revert.
- [x] FR-8: In DevTools, clear the site's storage. In Chrome settings → Languages, put German first (or use DevTools → Sensors → Locale `de-DE`), then reload → the UI is in German. Set `fr-CA` → French. Set `es-ES` → English. With a saved choice of `uk` and a browser locale of `de`, the UI is in Ukrainian.
- [x] FR-9: The selector lists English, Українська, Deutsch, Français. Picking each one switches all text instantly without a reload. Reload → the choice is kept. DevTools → Application → block third-party/site storage (or run `Object.defineProperty(window, 'localStorage', { get() { throw new Error() } })` in the console before switching) → switching still works, with no uncaught errors.
- [x] FR-10: After switching to Deutsch, `document.documentElement.lang === "de"` and the tab title is the German title. Repeat for one more language.
- [x] FR-11: The page shows the app name, tagline, coming-soon text, and selector. In DevTools device mode at 360 px width, there is no horizontal scroll and the content is readable.
- [x] FR-12: `git status` after `bun install`, `bun run build`, and `bun run test` shows no `node_modules`, `dist`, or coverage files.
- [x] Language selector works with the keyboard alone (Tab to it, arrow keys/Enter to change)
- [x] No console errors or warnings
- [x] User-facing text comes from the translations module, with keys in all locales (`en`, `uk`, `de`, `fr`). A grep of `src/components` and `src/App.tsx` finds no hard-coded UI strings.

## Constitution follow-up

- [ ] `specs/roadmap.md`: Phase 1 marked done
- [ ] `specs/tech-stack.md`: status changed from "proposed" to "confirmed" (or remaining open items noted)
- [ ] `CLAUDE.md` Commands section reflects the real scripts
- [ ] `README.md` has setup instructions. `CHANGELOG.md` created with a Phase 1 entry.
