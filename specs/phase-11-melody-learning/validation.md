# Validation — Melody learning

The feature is done (and the branch can be merged) only when every box is checked.

## Automated

- [ ] `bun run lint` passes
- [ ] `bun run format:check` passes
- [ ] `bun run build` passes
- [ ] `bun run test` passes. The course core has unit tests (steps, parts, stages, lesson order and content, merges, drills, ids, base octave, Home helpers), and a test over the whole library builds a course for every piece
- [ ] CI is green on the PR

## Manual checks

Run `bun run dev` and open http://localhost:3000 in Chrome. Use the computer keyboard unless a step says otherwise. Try at least these pieces: **Aria, BWV 515** (short, easy), **Aus meines Herzens Grunde, BWV 269** (a chorale with chords), **Für Elise** (long), and **Étude Op. 10 No. 1** (fast).

- [ ] FR-1: Every library piece has a **Learn** button, and its course opens (check at least the four pieces above and one more by another composer). The notation in the lessons matches the notation in the Player.
- [ ] FR-2: In "Für Elise" the course covers the first bars only (the course screen says which bars), and parts are 1 to 4 bars. In the Chopin étude the parts are shorter (fast music has more steps per bar), and no part has more than 32 steps (count the steps shown on the course screen for the largest one).
- [ ] FR-3: Play a part that has a tied note: you press it once. A part with a rest: the rest needs no key. In the chorale, a chord step needs all its notes at once.
- [ ] FR-4: The course screen groups the lessons as **Right hand**, **Left hand**, **Both hands**, in that order. Open a piece whose left hand has no notes in the first parts (if there is one): that stage is missing. In "Aria" check which stages exist and that the count is right.
- [ ] FR-5: In a stage: first **Read the notes**, then **Chords** (only if the hand plays chords; none in the Aria's right hand if there are none), then the parts, then the merges. Start "Read the notes" twice: the order differs, no note comes twice in a row, and the length is twice the number of distinct notes (8 to 24). The chord drill is the same for chords.
- [ ] FR-6: In a course with 6 parts the merges are 1–2, 3–4, 5–6, 1–4, 1–6. In a course with 3 parts the merges are 1–2 and 1–3. A merge plays the parts in order.
- [ ] FR-7: Finish a part lesson, go back, and reload the page: the stars and accuracy are still on its row. In DevTools → Application → Local Storage, `piano-tutor.progress` has a lesson id like `melody:bach/bwv-515-aria:right:part-1`.
- [ ] FR-8: Open a lesson in the bass (left hand): the computer-key octave is chosen so the notes fit (press `A`: it plays a note of the lesson). Open a lesson wider than the computer keys: the on-screen piano shows the whole range, and the notes outside the computer-key window can be played with the mouse or touch.
- [ ] FR-9: A course lesson shows the real notation of its bars; the current step is blue with a line on it; when you reach the next system the view moves on; a drill shows quarter notes. Clicking the notation does nothing. The accessible label (DevTools → Accessibility) names the current notes.
- [ ] FR-10: A wrong note flashes red on the key and counts as a mistake; a right note flashes green; at the end the summary shows accuracy, stars, and XP. Restart gives a new order in a drill and the same order in a part lesson. The heading shows the piece, the hand, and the lesson.
- [ ] FR-11: **Back** (and **Back to the course** after the summary) returns to the course screen. The old lessons on Home still return to Home.
- [ ] FR-12: The course screen shows the piece's title, composer, difficulty, what the course covers, and "N of M lessons finished". Each row shows title, steps, stars, accuracy or "Not played yet", runs, and **Start**; **Next** marks the first lesson without a run; any lesson can be started. With the network off and a piece never opened, a translated message and **Retry** show; Retry works when the network is back.
- [ ] FR-13: **Back** returns to where you came from (the Player with the library closed). **Open in Player** loads the piece in the Player.
- [ ] FR-14: Before any course lesson is finished, Home has no "Pieces you are learning". After finishing one, the section shows the piece with "1 lesson finished" and **Continue**, which opens the course screen. Finish lessons in two pieces: the one with more finished lessons comes first. **Reset progress** removes the section.
- [ ] FR-15: Switch to `uk`, `de`, `fr`: the Learn button, the course screen, the stage names, the lesson titles, the instruction lines, and the Home section are translated. **User skims the new translations.**
- [ ] A chord of both hands works with the on-screen piano and two fingers (touch emulation or a phone), and with a MIDI keyboard if one is available (optional).
- [ ] Offline: open a course for a piece once, then use `bun run build && bun run preview`, go offline, and open the course again: it works.
- [ ] At 360 px width (device mode): the course screen, its rows, and the lesson notation fit; no horizontal page scroll.
- [ ] On a real Android phone: open a course, play a part lesson with the on-screen piano, and finish it.
- [ ] No console errors.
- [ ] User-facing text comes from the translations module, with keys in all locales (`en`, `uk`, `de`, `fr`).

## Constitution follow-up

- [ ] `specs/roadmap.md`: Phase 11 status updated, with the outcome; timing / play-along and the other ideas are in the Backlog
- [ ] `specs/tech-stack.md`: `course.ts` and `src/course/` in the project layout; the `Lesson` fields; known debt (the course is verified only manually; the notation quality of dense pieces)
- [ ] `CHANGELOG.md` and `README.md` updated
