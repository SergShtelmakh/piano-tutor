# Requirements — Lesson controls

## Context

Roadmap Phase 20. The user's redesign canvas ([Piano Tutor — оновлений дизайн](https://claude.ai/artifact/8TBSo2UjJ2PTqZ4hoMbcrn), artboards `Lesson` and `PhoneLessonLand`) puts controls in the lesson header: tempo (−/+ bpm), a Left / Both / Right switch, a round Pause button, and a ring on the piano key to play. (The canvas's layout button belongs to Phase 21.)

Today a lesson only waits for the right pitches: there is no clock, so tempo and pause have no meaning yet. The answers to the clarifying questions decide what each control does; they are in **Decisions** below.

Facts from the code that shape the requirements:

- The judge (`src/core/lesson.ts`) judges every `noteon` on the bus, from any source, including `playback` (the Player's notes). Anything the app plays inside a lesson must therefore be ignored by the judge.
- Course steps (`stepsOf` in `src/core/course.ts`) know the staff of every note (treble = right hand, bass = left hand) and their position in sixteenths, but `Lesson` keeps only the pitches.
- The synth (`src/audio/synth.ts`) hides its `AudioContext`; a metronome click needs a small addition to it.

## Functional requirements

### Tempo, Listen, and the metronome

- **FR-1** The lesson header must have a tempo control: **−**, the tempo in bpm (quarter notes per minute), **+**. Range 40–200 bpm in steps of 5, default 80. The tempo is remembered on the device and used by every lesson.
- **FR-2** A **Listen** button must play the steps of the current page, from the current step to the end of the page, at the tempo, through the note pipeline (source `playback`): the piano sounds and the keys light up. A built-in lesson plays one step per beat; a course lesson plays its steps in the rhythm of the piece (their positions in the score). While it plays, the button shows **Stop**. Listen stops at the end of the page, on Stop, on Pause, on restart, and when the lesson closes. The staff does not move while listening.
- **FR-3** A **Metronome** toggle must click on every beat at the tempo while the lesson runs (not on the summary). It respects the volume and mute settings, is off by default, and is remembered on the device. Changing the tempo while it runs changes the click rate at once.
- **FR-4** Judging must stay as it is: the lesson waits for the right notes, with no timing score. Notes the app plays itself (Listen, the other hand, see FR-6) are never judged.

### Hands

- **FR-5** A course lesson for both hands must show a **Left / Both / Right** switch (Both by default). It is not shown for built-in lessons or for one-hand course lessons. Changing it restarts the lesson with the chosen hand.
- **FR-6** With **Left** or **Right**, only the chosen hand's notes are judged and shown as the current step; steps that have no notes for that hand are skipped. When the learner finishes a step, the app plays the other hand's notes of that step at once, then the other hand's notes of any skipped steps that follow, in the rhythm of the piece at the tempo. Other-hand notes before the first step of the chosen hand are not played.
- **FR-7** A one-hand run of a both-hands lesson is practice: the summary shows accuracy and a note that stars are saved only when both hands are played; no stars, XP, streak, or "last played" change is recorded for it. (Opening the lesson still counts as playing it, as in Phase 19.)

### Pause

- **FR-8** A round **Pause** button in the header must pause the lesson: Listen, the metronome, and the other hand's notes stop, every note the app holds is released, and nothing is judged while paused (keys still sound). An overlay shows **Resume**, **Restart**, and **Exit** (Exit = the lesson's Back). Resume continues from the same step.
- **FR-9** The lesson must pause by itself when the page is hidden (another tab, the phone's home screen). **Space** must toggle pause when no control has focus (a control that Tab reaches handles Space itself, as usual; the piano keys don't count as controls).

### Hint

- **FR-10** A **Hint** toggle in the header must put a ring on the piano key(s) of the current step (every note of a chord; in a one-hand run, only the chosen hand's notes). It is off by default and remembered on the device. Stars are not affected. A ring on a key that is off screen does not scroll the piano.

### Layout

- **FR-11** From 1024 px wide (and on a phone in landscape) all controls fit in the one header row, as on the canvas; on a phone in landscape Listen shows only its icon and the progress bar is hidden. On narrower screens (a phone in portrait, a small tablet) the header keeps Back, the title, Pause, and Mute, and a second row holds Listen, tempo, Metronome, Hint, and the hand switch; nothing scrolls sideways at 360 px. The header is hidden behind nothing: the staff and the piano still fit at 844 × 390.

## Non-functional requirements

- User-facing text goes through the translations module (English first, then `uk`, `de`, `fr`); the user skims the new strings.
- Works with the on-screen and computer keyboard (no MIDI device required); every control is a real button with a name and a focus ring; touch targets ≥ 44 px; pressed states use `aria-pressed`.
- No perceptible added input latency: judging stays synchronous in the bus listener.
- Pure rules (ignoring `playback` in the judge, the one-hand lesson and its accompaniment, the Listen schedule, the tempo steps, the settings parser) live in `src/core/` with unit tests; timers, audio, and storage stay in adapters.
- No new runtime dependencies.
- The scheduler releases every note it started (no stuck keys) on stop, pause, restart, hand change, and unmount.
- Colours only from theme tokens; a new token (if the hint ring needs one) gets a pair in `config/themeContrast.test.ts`.

## Out of scope

- Judging timing (early / late), a moving cursor, or stars that depend on rhythm (the Backlog's play-along items).
- A count-in, accented first beats, time signatures for the metronome, or a per-piece default tempo.
- Listen moving the staff cursor or turning pages; listening to the whole lesson at once.
- A hand switch for built-in lessons; practising one hand of a one-hand lesson against a recorded other hand; saving stars for one-hand runs.
- The layout editor and its button (Phase 21; it will reuse the Hint setting).

## Decisions

| Question                                     | Decision                                                                                                                                                                                   | Reason                                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| What does tempo do?                          | It sets the speed of **Listen** (the app plays the page) and of an optional **metronome**. Judging still waits; no timing score.                                                           | User choice. Keeps the phase small; timed play-along stays in the Backlog.                     |
| What does Left / Both / Right do?            | In a both-hands course lesson, practise one hand: only that hand is judged, the app plays the other hand's notes when a step is done. Such a run saves no stars. Hidden for other lessons. | User choice.                                                                                   |
| What does Pause do?                          | An overlay with Resume / Restart / Exit; stops Listen, the metronome, and the other hand; nothing is judged while paused. Auto-pause when the page is hidden; Space toggles.               | User choice.                                                                                   |
| How does the hint work?                      | A Hint toggle puts a ring on the key(s) of the current step; off by default, remembered; stars unaffected.                                                                                 | User choice. Phase 21's layout editor will reuse the same setting.                             |
| Tempo range and default                      | 40–200 bpm, steps of 5, default 80, one value for all lessons.                                                                                                                             | Agent default: covers slow practice and the library's pieces. Review.                          |
| What does Listen play?                       | The current page from the current step, both hands (also in a one-hand run), one step per beat for built-in lessons and the piece's rhythm for course lessons.                             | Agent default: a short, useful reference that matches what is on screen. Review.               |
| When does the other hand sound?              | Right after the learner finishes their step (not together with its first note), then the skipped other-hand steps in rhythm.                                                               | Agent default: the lesson has no clock to play "together"; this keeps the music going. Review. |
| What happens to a run when the hand changes? | The lesson restarts with the new hand.                                                                                                                                                     | Agent default: a run judged half with one rule and half with another has no meaning. Review.   |
| Phone portrait header                        | A second row for the practice controls.                                                                                                                                                    | Agent default: nine controls don't fit 360 px in one row. Review.                              |
