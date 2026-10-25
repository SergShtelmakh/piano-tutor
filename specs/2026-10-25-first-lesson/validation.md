# Validation — First lesson: play the right notes

The feature is done (and the branch can be merged) only when every box is checked.

## Automated

- [ ] `bun run lint` passes
- [ ] `bun run format:check` passes
- [ ] `bun run build` passes
- [ ] `bun run test` passes — `lesson.test.ts` covers FR-2 – FR-4, `lessons.test.ts` covers FR-5, `computerKeymap.test.ts` / `notes.test.ts` cover FR-6, `staff.test.ts` covers FR-8, `core.test.ts` covers FR-14
- [ ] CI is green on the PR

## Manual checks

Run `bun run dev`, open http://localhost:3000 in Chrome. Repeat the key checks on the Cloudflare preview of this branch on a phone.

- [ ] FR-1: on load, Free play is selected and the piano plays as before. Click **Lesson** → the lesson screen appears; click **Free play** → back. Language, volume, MIDI status, and footer are visible in both modes.
- [ ] FR-2 / FR-3: covered by `lesson.test.ts`. In the app: during the lesson, play a wrong note → the mistake counter goes up by one and the target stays the same; play the right note in the wrong octave (for example C3 when C4 is the target) → counted as a mistake.
- [ ] FR-4: finish the lesson with no mistakes → 100 %. Restart and make exactly 5 mistakes → 20 / 25 = 80 %.
- [ ] FR-5: play the lesson twice (use **Restart**, **Play again**, and a page reload) → the order is different every time. Across a full lesson, all targets lie between B3 and C5, the same note never appears twice in a row, and the progress shows "Step N of 20".
- [ ] FR-6: in free play, the left-most key of the on-screen piano is a B before the base C (with the default octave: B2), and the piano has 16 white keys (it had 15). `ShiftLeft` plays that B; after `X` (octave up) it plays the next B up. The key shows a `⇧` (or the layout's label) on it. Typing in the MIDI / language controls with Shift held does not play notes. Pressing Shift together with other note keys does not break them.
- [ ] FR-7: the lesson screen shows a grand staff with a treble clef and a bass clef. B3 is drawn on the bass staff (space above the top line); C4 is a whole note on a ledger line between the staves; E4 on the bottom treble line, G4 on the second line, B4 on the middle line, C5 in the space above it. Only one note is drawn at a time.
- [ ] FR-8: covered by `staff.test.ts`. Also compare the drawn positions of all nine notes of the pool with a music reference.
- [ ] FR-9: the title, the instruction "Play the note shown on the staff", the staff, "Step 1 of 20", and the counters are shown. The target key is **not** highlighted and no note name is shown outside the piano's own key labels. In DevTools, the staff has an accessible label naming the target (e.g. "Target note: C4"; in `uk` "до4").
- [ ] FR-10: a right note flashes the played key and the notehead green; a wrong note flashes them red, for about a third of a second; sound is not delayed. Pressing the same wrong key twice quickly flashes red twice. Green, red, and held keys look different from each other.
- [ ] FR-11: play part of the lesson with the computer keyboard, part with the on-screen piano (mouse and touch), and, if available, part with a MIDI keyboard. Every source is judged the same way, and every note of the lesson (B3–C5) can be played from each source without changing the octave.
- [ ] FR-12: **Restart** in the middle of the lesson → step 1, counters at 0, and a new order. **Back to free play** → free play, and the octave is back to what it was before the lesson.
- [ ] FR-13: after the last note the summary shows "Lesson complete", accuracy, correct notes, and mistakes. Notes played now make sound but change nothing. **Play again** → step 1 with a new order; **Back to free play** → free play.
- [ ] FR-14: covered by `core.test.ts`. In the app with `uk`: 1 → "1 помилка", 2 → "2 помилки", 5 → "5 помилок"; with `fr`, accuracy reads like "80 %".
- [ ] FR-15: every new string is translated in `en`, `uk`, `de`, `fr`; the user skims them.
- [ ] Staff rendering: the clefs and the staff look correct on desktop Chrome **and on Android Chrome** (preview URL); both clefs are drawn as outlines, not as text.
- [ ] Sticky Keys: on Windows, press `ShiftLeft` five times quickly in free play and note whether the Sticky Keys prompt appears (known risk, see `plan.md`); decide with the user whether to keep `ShiftLeft`.
- [ ] Works with the computer keyboard without a MIDI device
- [ ] Layout at 360 px width: the staff, lesson, and summary fit, the staff is readable, the 16 white keys and their labels fit, no horizontal scroll
- [ ] No console errors

## Constitution follow-up

- [ ] `specs/roadmap.md` — phase status updated; the sheet-music backlog item noted as started (single notes only)
- [ ] `specs/tech-stack.md` — translations section mentions interpolation and plurals; project layout mentions `src/lesson/` and the staff; the computer-keyboard layout mentions `ShiftLeft`
- [ ] `CHANGELOG.md` / README updated
