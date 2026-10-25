# Validation — Game mechanics & local progress

The feature is done (and the branch can be merged) only when every box is checked.

## Automated

- [x] `bun run lint` passes
- [x] `bun run format:check` passes
- [x] `bun run build` passes
- [x] `bun run test` passes — `progress.test.ts` covers FR-1 – FR-7 and FR-9; `lessons.test.ts` covers the catalog (FR-13)
- [ ] CI is green on the PR

## Manual checks

Run `bun run dev`, open http://localhost:3000 in Chrome. Start with no saved progress (DevTools → Application → Local Storage → delete `piano-tutor.progress`). Repeat the main flow on the Cloudflare preview of this branch on a phone.

- [ ] FR-1 / FR-2: finish a run with no mistakes → summary shows 3 filled stars and "+25 XP". Finish one with exactly 5 mistakes (80 %) → 2 stars, "+20 XP". Finish one with 7 mistakes (20 / 27 ≈ 74 %) → 1 star, "+15 XP". Press **Restart** halfway, then **Back**, then finish nothing → XP on Home is unchanged by those.
- [ ] FR-3: after runs totalling 50 XP or more, the summary of the run that crossed 50 says "Level up! You reached level 2"; Home shows level 2 and the bar at "N / 100 XP" (50 into level 2 needs 100 more to reach 150).
- [ ] FR-4 / FR-5: on a fresh start, finish a run → streak 1 day, best 1. Finish another the same day → still 1. In DevTools, edit `lastDay` in `piano-tutor.progress` to **yesterday's** date and reload → Home shows the stored streak; finish a run → streak goes up by 1 and the summary may say "New best streak!". Edit `lastDay` to **three days ago** and reload → Home shows streak 0 (best unchanged); finish a run → streak 1. Edit `lastDay` to **tomorrow** and finish a run → streak unchanged.
- [ ] FR-6: finish a run at 100 %, then one with mistakes → the lesson card still shows 3 stars and 100 %; the runs count went up by 2.
- [ ] FR-7: covered by `progress.test.ts`; `src/core/progress.ts` has no React, DOM, storage, or `Date.now()` / `new Date()` use (check by reading the imports and searching the file).
- [ ] FR-8: finish a run, reload the page → Home shows the same level, XP, streak, and lesson card.
- [ ] FR-9: in DevTools set `piano-tutor.progress` to `not json`, reload → no crash, Home shows level 1, 0 XP, no stars. Set it to `{"version":99}` → same. Finish a run → a valid value is saved again.
- [ ] FR-10: open the app in a window where site data is blocked (Chrome settings → block third-party / all cookies and site data for `localhost`, or an Incognito window with site data blocked) → the app works, Home shows the "Progress can't be saved in this browser" note, and a finished run still updates Home until the page is reloaded.
- [ ] FR-11: on load, Home is selected. **Free play** shows the piano with the octave control as before; **Home** goes back. Start the lesson → neither switch button looks selected; pressing **Free play** leaves the lesson and the octave is restored. Language, volume, MIDI status, and footer are visible on every screen.
- [ ] FR-12: the stats bar shows the level, an XP bar with "N / M XP", the streak with plural forms (`en`: "1 day" / "2 days"; `uk`: "1 день" / "2 дні" / "5 днів"), and the best streak.
- [ ] FR-13: before any run, the Note reading card shows three empty stars and "Not played yet"; after runs it shows best stars, best accuracy (formatted per language), and "N runs" with plural forms. **Start** opens the lesson.
- [ ] FR-14: **Back to home** in the lesson and in the summary goes to Home; the octave is restored.
- [ ] FR-15: finish one run in `bun run dev` (Strict Mode is on) → the runs count goes up by exactly 1 and XP by exactly the "+N XP" shown, not twice. The summary shows stars with a screen-reader label ("2 of 3 stars"), "+N XP", the streak, and "New best!" only when the accuracy beat an earlier run (not on the first run).
- [ ] FR-16: after the summary, **Back to home** → the stats bar and the card already show the new values without a reload.
- [ ] FR-17: **Reset progress** → confirmation appears; **Cancel** → nothing changes. **Reset progress** → **Reset** → level 1, 0 XP, streak 0, best 0, card "Not played yet"; reload → still reset. Language and volume are unchanged.
- [ ] FR-18: every new string is translated in `en`, `uk`, `de`, `fr`; the user skims them.
- [ ] Works with the computer keyboard without a MIDI device (play a full run with keys only)
- [ ] Layout at 360 px width: stats bar, lesson card, reset confirmation, and summary fit; no horizontal scroll
- [ ] No console errors

## Constitution follow-up

- [ ] `specs/roadmap.md` — phase status updated
- [ ] `specs/tech-stack.md` — project layout mentions `src/core/progress.ts`, `src/progress/`, the Home screen, and the progress storage key
- [ ] `CHANGELOG.md` / README updated
