# Plan — Melody learning

> Roadmap phase: Phase 11 — Melody learning
> Branch: `feature/melody-learning`
> Status: Implemented (manual validation open)

## Goal

The learner picks a piece in the library, presses **Learn**, and gets a course that teaches the opening of the piece step by step: the notes it uses, its chords, then the parts one by one, then the parts joined together, first for the right hand, then for the left hand, then for both hands. Every lesson shows the real notation of the piece and is judged by the existing lesson engine.

## Approach

**Core (pure, `src/core/`)**

- `lesson.ts`: `Lesson` gets optional fields; lessons without them behave as before.
  - `titleParams?: Record<string, string | number>`: values for `{…}` in the title text.
  - `hand?: 'right' | 'left' | 'both'` and `pieceTitle?: string`, for the lesson heading.
  - `notation?: { score: Score; stepTimes: readonly number[] }`: the notation to draw (the bars of the lesson), and for each step the time of its column in that score. A lesson with `notation` is drawn with `ScoreView`; without it, with `StaffView` as now.
- `course.ts` (new): everything about turning a score into lessons.
  - `stepsOf(bars, hand)`: the steps of a hand (or both) in the given bars: the notes of the columns that begin at the same `unit`, skipping rests and the `tiePrev` notes of tied columns; steps with no notes are dropped. Each step keeps its column `time` (seconds in the score).
  - `splitParts(score)`: parts of whole bars, each at most 4 bars and 32 steps (both hands), at least 1 bar; bars with no step join the part before (the first bars, if empty, join the next); at most 6 parts. Returns the parts and whether the piece was cut (`truncated`), with the covered bar range.
  - `notationOf(bars)`: a `Score` from a subset of bars (`low` and `high` from its notes). `drillNotation(steps)`: a synthetic score for a drill: the steps become quarter notes (a chord is one column) in 4/4 bars at 120 bpm, built with `buildScore`, so `stepTimes[i] = i * 0.5`.
  - `baseOctaveFor(notes)`: the base octave in `[MIN_BASE_OCTAVE, MAX_BASE_OCTAVE]` whose computer-keyboard window (`keyboardWindow`) holds the most of the notes; ties go to the octave nearest to the middle of the notes.
  - `buildCourse(score, pieceId)`: `{ pieceId, totalBars, covered: { from, to }, truncated, stages }`, where each stage is `{ hand, lessons }` and each `CourseLesson` is `{ id, kind: 'notes' | 'chords' | 'part' | 'merge', hand, stepCount, titleKey, titleParams, create(random) }`. The order and content follow FR-4 – FR-6: right, left, both; notes, chords, parts, merges. `create` returns a `Lesson` with `baseOctave`, `steps`, `pages` (`evenPages`), `notation`, and the title fields. Drills use `randomPicks` / `randomSequence` (no repeat in a row; length from FR-5) from `lessons.ts` with an injectable random source; part and merge lessons are fixed.
  - `mergeGroups(partNumbers)`: the pairs-then-pairs plan of FR-6 (for `[1..6]`: `[1,2] [3,4] [5,6] [1..4] [1..6]`), over the parts that exist in the stage.
  - `lessonId(pieceId, hand, kind, n?)` and `pieceIdOfLesson(id)` (null for old lesson ids), and `finishedLessons(course, records)`, `piecesInProgress(records, pieces)` (pieces that have at least one finished course lesson, with their count, ordered by count, then title) for Home.
- `lessons.ts`: `nextLessonId` already takes any list of `{ id }`, so the course uses it as is.

**Course loading and state (`src/course/`, new)**

- `loadCourse.ts`: `loadLibraryPiece(piece)` (Phase 10) → `buildScore` → `buildCourse`. Returns the course or an error (`network` or a parse error).
- `CourseProvider.tsx` + `context.ts`: which piece's course is open, its status (`loading`, `ready`, or `error` with Retry), `openCourse(piece)`, `closeCourse()`, `lessonById(id)` (a course lesson as a `LessonEntry`-like object), and an in-memory cache of built courses by piece id. It sits inside `LibraryMarksProvider` and above `PlayerProvider` in `App`.

**UI (`src/components/`)**

- `ScoreView`: `onSeek` becomes optional; without it there is no click handler and no pointer cursor.
- `NotationView.tsx` (new): a lesson's notation. It measures its width (`useElementWidth`), lays the score out (`layoutSystems`), and draws `ScoreView` with `position` = the current step's `stepTimes[stepIndex]` (a hair after the column start), `sounding` = the current step's notes, `playing` false, no seek. It reuses the "current and next system" window and the cursor line, so no new drawing code is needed.
- `LessonScreen`: for a lesson with `notation` it draws `NotationView` instead of `StaffView`; the heading is `pieceTitle` (when set) plus `t(titleKey, { ...titleParams, hand })`; the piano gets `include` (the lesson's note range) so notes outside the computer-key window are on screen. Everything else (counters, instruction, restart, summary) is unchanged. `onExit` is given by `App`: a course lesson returns to the course screen.
- `CourseScreen.tsx` (new): header, the covered-range note, the "N of M lessons finished" line, lessons grouped by stage (using the `LessonCard` look: title, steps, stars, accuracy, runs, **Start**, **Next** badge), loading and error states with Retry, and **Back** and **Open in Player**. `LessonCard` gets a `title` string prop (the parent translates), so `HomeScreen` passes `t(entry.titleKey)` and the course screen passes the translated course title.
- `LibraryPanel` rows and `PieceInfo`: a **Learn** button, which calls `openCourse` and closes the library panel.
- `HomeScreen`: a `LearningPieces.tsx` section ("Pieces you are learning") from `piecesInProgress`.
- `App`: screen state is `lessonId` (a lesson is open), then the open course (course screen), then `mode`. The mode switch shows no selected mode while a lesson or a course is open; choosing a mode closes the course. A course lesson is looked up with `lessonById`; the old lessons with `LESSON_CATALOG`.

**Translations**: `libraryLearn`, `courseTitle…` and the course screen strings (`courseCovers`, `courseFinished`, `courseBack`, `courseOpenInPlayer`, `courseRetry`, `courseLoading`, `courseStageRight`, `courseStageLeft`, `courseStageBoth`), the lesson titles with parameters (`courseLessonNotes`, `courseLessonChords`, `courseLessonPart`, `courseLessonMerge`), the hand names, `homePiecesTitle`, `homePieceFinished` (plural), in `en` first, then `uk`, `de`, `fr`.

## Task groups

1. **Course core (pure)**
   - [x] `Lesson` fields in `lesson.ts`; `course.ts` with `stepsOf`, `splitParts`, `notationOf`, `drillNotation`, `baseOctaveFor`, `mergeGroups`, `buildCourse`, ids, and the Home helpers
   - [x] Unit tests (scores built from small pieces made in code): steps (chords, rests, ties, both hands), parts (4-bar and 32-step limits, empty bars, the 6-part cap, `truncated`), stages present or absent (a one-hand piece, a rest-only hand), lesson order and content (notes, chords only when present, parts, merges), merge groups for 1–7 parts, drill length and no immediate repeat, drills random but part lessons fixed, ids and `pieceIdOfLesson`, `baseOctaveFor`, and `piecesInProgress`
   - [x] A test over the whole library: every piece builds a course with at least one stage and at least one lesson, and every lesson creates a lesson with steps, and with every step's notes on the notation
2. **Lesson view with the real notation**
   - [x] `ScoreView` with an optional `onSeek`; `NotationView`; `LessonScreen` switches by `lesson.notation`; the heading; the piano `include`; `LessonCard` with a `title` prop
   - [ ] Check by hand with a throw-away lesson (a library piece's part) before the course screen exists: the current step is blue, the system advances, a chord needs all its notes, restart works
3. **Course loading, state, and screen**
   - [x] `src/course/` (`loadCourse`, `CourseProvider`, context); `CourseScreen`; `App` routing (lesson → course → mode); the **Learn** button in `LibraryPanel` and `PieceInfo`
   - [ ] Check offline: open a course after opening the piece once, then with the network off
4. **Home section**
   - [x] `LearningPieces` on `HomeScreen`; Reset progress clears it
5. **Translations, docs, validation**
   - [x] All new keys in `en`, `uk`, `de`, `fr` (FR-15)
   - [x] `README.md`: "Learn a piece" (what the course teaches, the order, the limits)
   - [ ] Run `validation.md`: automated gates, then manual checks with several pieces on desktop and an Android phone; ask the user to skim the new `uk` / `de` / `fr` strings

## Files touched

| File                                                                              | Change                                                   |
| --------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `src/core/lesson.ts`                                                              | Optional `titleParams`, `hand`, `pieceTitle`, `notation` |
| `src/core/course.ts`, `course.test.ts` (new)                                      | Course building and Home helpers                         |
| `src/course/loadCourse.ts`, `context.ts`, `CourseProvider.tsx` (new)              | Loading and state                                        |
| `src/components/NotationView.tsx`, `CourseScreen.tsx`, `LearningPieces.tsx` (new) | Lesson notation, course screen, Home section             |
| `src/components/ScoreView.tsx`, `LessonScreen.tsx`, `LessonCard.tsx`              | Optional seek, notation lessons, a `title` prop          |
| `src/components/LibraryPanel.tsx`, `PieceInfo.tsx`, `HomeScreen.tsx`              | Learn buttons, Home section                              |
| `src/App.tsx`                                                                     | Course state and routing                                 |
| `src/i18n/locales/{en,uk,de,fr}.ts`                                               | New strings                                              |
| `README.md`                                                                       | Learn a piece                                            |

## New dependencies

None.

## Risks & open questions

- **The notation of a part is only as good as the Phase 9 reduction.** One voice per staff, no beams or tuplets; fast pieces (the Chopin études) have many flags. Parts are short (at most 32 steps), so this stays readable, but check several pieces with the user.
- **Two hands means many keys at once.** A step of the "both hands" stage can have 4 to 6 notes (a chorale has four voices). Computer keyboards may not report that many keys together (ghosting), so the on-screen piano (multi-touch) or a MIDI keyboard is needed for some steps. If this turns out too hard, the first fix is to show the number of keys in the instruction, and the next is a "melody plus one bass note" simplification (a later phase).
- **Range wider than the computer keys.** A part spanning more than 18 semitones cannot be played with the computer keys alone. The piano shows the whole range and the base octave covers the most notes, but some lessons will need the piano or MIDI. Every lesson stays playable on the on-screen piano (mission principle 4).
- **A melody in the bass.** The right/left split is by pitch, so a piece whose tune sits below C4 has a thin right-hand stage. Accept it for now; a per-piece override is a backlog idea.
- **Course size.** At most 6 parts, so a stage has at most 1 + 1 + 6 + 5 = 13 lessons and a course about 37. Check that the course screen stays easy to scan at 360 px.
- **Pieces with a very small first part.** Pieces that start with a pickup or a bar of rests give a short first part. The merge rules handle it, but check "Für Elise".
- **Progress ids.** Course lesson ids contain the piece id (`bach/bwv-515-aria`), so renaming a library file or slug orphans the saved results. Treat ids as permanent, as for the old lessons (documented in the README, "how to add a piece").

## Notes from the implementation

- A hand with one single pitch has no "Read the notes" drill, and a hand with only one chord has no chord drill: a drill never repeats the same step twice in a row, so it needs at least two different items. (The spec says so in the Decisions; the part lessons teach those notes anyway.)
- `LessonCard` now takes `id` and `title` (a string) instead of a lesson entry, and `LessonSummary` and `LessonScreen` take the label of the back button, so a course lesson returns to its course.
- `App` is split into the providers and a `Shell` inside them, because the screens need the course state.
- The whole library is built into courses by `config/libraryCourses.test.ts`: every piece gets 1 to 3 stages and at most 37 lessons, and every step of every lesson is drawn on its notation at the step's time.
- Real courses: 24 to 37 lessons for a piece, the largest merge lesson has up to 192 steps (six dense parts together).
