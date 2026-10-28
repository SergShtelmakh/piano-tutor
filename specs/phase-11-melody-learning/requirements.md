# Requirements — Melody learning

## Context

Roadmap Phase 11. Phases 9 and 10 gave the app a Player and a library of public-domain pieces: the learner can _hear_ a piece and see it as sheet music. This phase lets the learner **learn to play it**. The learner picks a piece in the library and presses **Learn**; the app splits the piece into a **course of lessons**, ordered from the simplest to the hardest:

1. read the notes the piece uses,
2. then the chords,
3. then the piece part by part (phrases),
4. then the parts joined together,

first for the right hand, then for the left hand, then for both hands together.

What exists and is reused:

- **The lesson engine** (`core/lesson.ts`, `useLesson`): a lesson is a list of steps (a step is one note or a chord); a step with several notes is done when all its notes are held at once; a wrong note is a mistake; at the end the learner gets accuracy, stars, XP, and a streak (Phase 5). It judges pitches only, with no timing, and it works with MIDI, the on-screen piano, and the computer keyboard.
- **The notation** from Phase 9 (`buildScore`, `layoutSystems`, `ScoreView`): sharps, note values, rests, bars, ties; one voice per staff. The right hand is the **treble staff** (notes from C4 up) and the left hand is the **bass staff**, the same split the Player uses.
- **The library** (Phase 10): `LIBRARY_PIECES`, `loadLibraryPiece` (fetches a piece; it is cached for offline after the first open), and the library panel and piece info line, where the **Learn** entry points go.
- **Progress** (Phase 5): results are saved per lesson id, so generated lessons only need stable ids. The progress format does not change.
- **The piano** (Phases 8 and 10) can show a given note range and follow the notes to play (`include`, `focusNotes`).

What has to be new: a way to **build lessons from a piece** (pure code), a lesson view that shows **the piece's real notation** with the current step marked, a **course screen**, and entry points (library and Home).

Terms used below:

- **Part:** a stretch of the piece of 1 to 4 bars, with at most 32 steps (both hands together). The text is split into parts once per piece, and all stages use the same parts. A part is also a **phrase** to play.
- **Step:** the notes that start together. A note that continues a tie is not a step; rests are not steps.
- **Stage:** right hand, left hand, or both hands.
- **Course:** the ordered lessons of one piece. It covers the **first 6 parts** of the piece.
- **Drill:** a lesson of random steps taken from the piece (for reading single notes, and for chords), shown as simple notation.

The clarifying questions and their answers are in the **Decisions** table. Rows marked _(agent default)_ were not asked; please review them.

## Functional requirements

**Building the course (pure core)**

- **FR-1** Every library piece has a course. It is built from the piece's score (the Phase 9 reduction), so the notation the learner sees and the steps they play always agree. The right hand is the notes on the treble staff, the left hand the notes on the bass staff.
- **FR-2** The piece is split into **parts** from its first bar: each part is as many whole bars as fit in **4 bars** and **32 steps** (the right and left hand together), and at least 1 bar. Bars without any note are not a part of their own (they join the part before). The course covers the **first 6 parts**; a shorter piece has fewer. A long piece is not cut mid-bar.
- **FR-3** **Steps** are taken from the score columns: the notes that begin at the same moment form one step (a chord when there are several). The continuation of a tied note is not a step (the learner presses it once), and rests are not steps. In the "both hands" stage a step holds the notes of both hands that begin together.
- **FR-4** The course has up to three **stages**, in this order: **right hand**, **left hand**, **both hands together**. A hand with no notes in the covered parts has no stage, and then "both hands" is left out too (it would be the same as the one hand).
- **FR-5** A right-hand or left-hand stage has these lessons, in this order:
  1. **Read the notes:** a drill over the distinct pitches the hand plays in the covered parts, in random order, never the same note twice in a row, with a length of twice the number of pitches (at least 8 and at most 24 steps). Present when the hand plays at least two different pitches.
  2. **Chords:** a drill over the distinct chords (two or more notes at once) the hand plays, in random order, never the same chord twice in a row, with a length of twice the number of chords (at least 6 and at most 16 steps). Present only if the hand plays at least two different chords.
  3. **Parts:** one lesson per part in which the hand has notes, in the piece's order. The steps are exactly the music of that part, in order.
  4. **Merges** (FR-6).
     The **both hands** stage has the **parts** and the **merges**, with the steps of both hands together.
- **FR-6** **Merges** join neighbouring parts, pair by pair and then pair of pairs, until all covered parts are together: for 6 parts the merges are 1–2, 3–4, 5–6, then 1–4, then 1–6. A leftover part moves up to the next level unchanged. Only parts that exist in that stage count, and a stage with a single part has no merge. A merge lesson plays the steps of all its parts in order.
- **FR-7** A course lesson has a **stable id** (`melody:<piece id>:<stage>:<kind>`, for example `melody:bach/bwv-515-aria:right:part-2`), a title made of translated pieces (kind, part number and bars, or part range), and the stage. Progress is saved under that id with the existing format, so nothing needs migrating.
- **FR-8** For every lesson the **computer-keyboard octave** is chosen so that the window of the computer keys covers as many of the lesson's notes as possible. The on-screen piano shows the whole range of the lesson's notes (as the Player does for a piece), so notes outside the computer-key window can be played on the piano or with a MIDI keyboard. (Every lesson stays playable with the on-screen piano.)

**Lesson screen**

- **FR-9** A course lesson shows **the real notation**: the bars of the lesson (a drill shows its steps as quarter notes), drawn like the Player's score, with the **current step marked blue** and a cursor line on it. The screen shows the system of the current step and the next one, and moves on when the learner does. Clicking the notation does nothing. The accessible label names the current notes, as in other lessons.
- **FR-10** Judging, counters, the right/wrong flashes on the keys, the summary, stars, XP, and the streak work exactly as in the existing lessons. The instruction line says whether the lesson has chords ("press all notes of the highlighted chord at the same time") or not. The lesson heading shows the piece's title, then the stage and the lesson title. The learner can **restart** a lesson, and a restart gives a **new random order** in drills (and the same notes in order in part and merge lessons).
- **FR-11** Leaving a course lesson (Back or after the summary) returns to the **course screen** of that piece, not to Home. Lessons from the old curriculum behave as before.

**Course screen**

- **FR-12** The library panel and the piece info line get a **Learn** button for every piece. It opens the **course screen**: the piece's title, composer, and difficulty, a short note about what the course covers ("The first 6 parts, bars 1–N"), and the lessons **grouped by stage** (headings "Right hand", "Left hand", "Both hands"), in the order of FR-5. A lesson row shows the title, the number of steps, the best stars and best accuracy (or "Not played yet"), the number of runs, and a **Start** button, as on Home. A **Next** badge marks the first lesson without a finished run. **Nothing is locked.** While the piece loads the screen says so; if it cannot be loaded (offline and never opened) a translated message with a **Retry** button shows.
- **FR-13** The course screen has a **Back** button (to where the learner came from) and an **Open in Player** button, which loads the piece in the Player. The screen shows how many of its lessons have a finished run ("5 of 18 lessons finished").

**Home**

- **FR-14** Once the learner has finished at least one course lesson, **Home** shows a section **"Pieces you are learning"**, below the lessons and above Reset progress. It has one card per piece (title, composer, "N lessons finished") with a **Continue** button that opens the course screen. Pieces are ordered by the number of finished lessons (most first), then by title (the saved progress has no dates, and its format does not change). The section is hidden when there are none. Reset progress clears it.

**Translations**

- **FR-15** Every new string exists in `en`, `uk`, `de`, `fr`: the Learn button, the course screen texts, the stage names, the lesson kinds and titles (with parameters), the instruction lines, the Home section, and the messages. Composer and piece names keep the forms from Phase 10.

## Non-functional requirements

- User-facing text goes through the translations module (English is the default; `uk`, `de`, and `fr` get the keys too).
- Works with the on-screen and computer keyboard (no MIDI device required): a lesson whose notes do not fit the computer-key window is still playable on the on-screen piano. Chords across both hands need several fingers or keys at once (at most as many as the notes of a step).
- Pure core: splitting into parts, extracting steps, the stages and lessons, merges, ids, drills, choosing the octave, and slicing the notation live in `src/core/` with unit tests and no React, DOM, or audio imports. The course is built with an injectable random source, like the existing lessons. Fetching, the screens, and storage stay thin.
- One note pipeline and the existing judge: no change to the note bus, the synth, or `judge`. No change to the saved progress format.
- No perceptible added input latency: judging is unchanged, and the notation of a lesson is laid out once per lesson and width, not per note.
- Offline: a piece the learner has opened (in the Player or in a course) opens its course again offline, because the file is cached after the first load.
- No colour-only signals: the current step is also the cursor line, and "Next" is a word.
- Layout works at 360 px width: the course rows wrap, buttons are easy to hit, and there is no horizontal page scroll.
- No new runtime dependencies.

## Out of scope

- **Timing and rhythm:** lessons judge pitches only. There is no tempo, metronome, or score for playing in time (note values are only shown). This is the next natural phase ("play along").
- Fingering numbers, hand-position hints, and practising one hand inside the "both hands" stage.
- Courses for files opened from the learner's disk, and choosing which hand is the melody by track.
- Changing the size of parts, learning beyond the first 6 parts, or choosing which parts to learn.
- Locked lessons, spaced repetition, adaptive practice, and "next lesson" buttons in the summary.
- Listening to the part before learning it, and hearing the other hand play along.
- Pieces' left-hand and right-hand roles when a melody lies in the bass; the split is by pitch (C4 and up is the right hand), as in the Player.
- Changes to the old lessons (`LESSON_UNITS`) or the Player.

## Decisions

| Question                               | Decision                                                                                                                     | Reason                                                                                                          |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Which hands                            | Right hand, then left hand, then both together                                                                               | User choice: a full course, from the simplest (one hand) to the hardest (both).                                 |
| How the notes are shown                | The real notation of the piece (sharps, note values, bars), with the current step marked                                     | User choice: the learner plays what they see in the piece, and the Phase 9 notation is reused.                  |
| Which pieces and how long              | Every library piece; the course covers its first 6 parts                                                                     | User choice: every piece can be learned, and a long piece does not give hundreds of lessons.                    |
| Entry and order                        | A Learn button in the library and a "Pieces you are learning" section on Home; lessons ordered simple to hard, with no locks | User choice, in line with the "no locks" decision of Phase 6.                                                   |
| Parts and phrases _(agent default)_    | One concept: a part is up to 4 bars and 32 steps, and it is also the phrase to play                                          | A phrase is usually 4 bars; the step cap keeps fast music in short lessons. One concept keeps the course small. |
| Order inside a stage _(agent default)_ | Read the notes, chords, parts, then merges                                                                                   | It follows the order the user described: notes first, then chords and phrases, then joining the parts.          |
| Drills _(agent default)_               | Drills have a random order and show simple notation (quarter notes); part and merge lessons keep the piece's order           | A drill trains reading, not memory of the tune.                                                                 |
| Hand split _(agent default)_           | By pitch: C4 and up is the right hand, lower is the left hand                                                                | The same rule as the Player's notation; track information is unreliable.                                        |
| Ties and rests _(agent default)_       | A tied note is played once; rests are not steps                                                                              | The judge has no timing, so a held note and a rest need no key press.                                           |
| Timing _(agent default)_               | Not judged in this phase                                                                                                     | The engine judges pitches only; timing needs a new judge and a clock, which is a phase of its own.              |
| Summary _(agent default)_              | The same summary as other lessons, with the Back button returning to the course                                              | Keeps the change small; a "next lesson" shortcut can follow.                                                    |
| Numbering _(agent default)_            | This is Phase 11; keyboard size and calibration moved to Phase 12                                                            | The user asked for this as the next phase.                                                                      |
| Branch base _(agent default)_          | `feature/melody-learning` starts from `feature/midi-library`, because Phase 10 is not merged into `main` yet                 | It needs the library; rebase onto `main` once Phase 10 is merged, so the PR stays one phase.                    |
