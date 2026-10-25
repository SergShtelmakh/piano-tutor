# Requirements — Lesson content

## Context

Roadmap Phase 6: enough content for a real first week. Phase 4 delivered one lesson (random note reading, B3–C5) on a grand staff that shows **one whole note**. Phase 5 added progress, stars, XP, a streak, and a Home screen built from `LESSON_CATALOG`. This phase turns that single lesson into a **small curriculum**: single notes in the treble clef, single notes in the bass clef (left hand), both clefs mixed, simple melodies for each hand, and intervals and chords.

Two things in the app have to grow for this:

- **The staff shows a row of steps** (a phrase of up to 8), with the current step highlighted, so the learner can read ahead and recognise a tune. A step can be a **chord** (several noteheads stacked on one stem position, including seconds drawn side by side).
- **Home groups the lessons by unit** and suggests the next lesson. Lessons are **not locked**: the user chose "no locks, just order". The roadmap item "unlock order tied to progress" becomes a "Next" hint on the first unplayed lesson.

Constraints that shape the content:

- **Mission principle 4:** every lesson is playable with the computer keyboard and the on-screen piano. Both cover 18 semitones at a base octave _b_: from the B below C(_b_) to the E above C(_b_ + 1) (`KEY_OFFSETS` −1 … 16). Every note of a lesson must lie in that window for the lesson's `baseOctave`.
- **White keys only:** the staff has no accidentals yet (`staffPosition` returns `null` for black keys), so all content is in C major / A minor without sharps or flats.
- **Saved progress is `version: 1`** and keyed by lesson id. The existing lesson keeps its id `note-reading`, so no migration is needed and old results stay.

The clarifying questions and their answers are in the **Decisions** table. Rows marked _(agent default)_ were not asked; review them.

## Functional requirements

**Curriculum (pure, `src/core/`)**

- **FR-1** The catalog is organised in **units**, in this order, each with lessons in this order:

  | Unit (heading)           | Lesson id         | Title (en)                    | Content                                                                                   | Base octave |
  | ------------------------ | ----------------- | ----------------------------- | ----------------------------------------------------------------------------------------- | ----------- |
  | Right hand · treble clef | `treble-c-g`      | Middle C to G                 | 20 random notes from C4 D4 E4 F4 G4                                                       | 4           |
  |                          | `note-reading`    | Around middle C               | 20 random notes from B3 … C5 (unchanged from Phase 4)                                     | 4           |
  |                          | `treble-g-e`      | Up to high E                  | 20 random notes from G4 A4 B4 C5 D5 E5                                                    | 4           |
  | Left hand · bass clef    | `bass-c-g`        | C to G in the bass            | 20 random notes from C3 D3 E3 F3 G3                                                       | 3           |
  |                          | `bass-octave`     | The whole bass octave         | 20 random notes from B2 … B3                                                              | 3           |
  | Both clefs               | `both-clefs`      | Across middle C               | 20 random notes from C3 … E4 (bass and treble mixed)                                      | 3           |
  | Melodies                 | `melody-mary`     | Mary Had a Little Lamb        | Fixed tune, right hand, C4–G4                                                             | 4           |
  |                          | `melody-ode`      | Ode to Joy                    | Fixed tune (first two phrases, A + A′), right hand, C4–G4                                 | 4           |
  |                          | `melody-twinkle`  | Twinkle, Twinkle, Little Star | Fixed tune, right hand, C4–A4                                                             | 4           |
  |                          | `melody-ode-left` | Ode to Joy (left hand)        | The `melody-ode` tune one octave lower, C3–G3                                             | 3           |
  | Intervals & chords       | `intervals`       | Intervals                     | 12 random two-note intervals (a second up to an octave), both notes white keys in C4 … C5 | 4           |
  |                          | `chords-major`    | Major chords: C, F, G         | 12 random root-position triads from C (C4 E4 G4), F (F4 A4 C5), G (G4 B4 D5)              | 4           |
  |                          | `chords-all`      | Major and minor chords        | 12 random root-position triads from C, Dm, Em, F, G, Am (D4 F4 A4, E4 G4 B4, A4 C5 E5)    | 4           |

  The melodies are traditional / public-domain tunes, written as sequences of single notes **without rhythm** (every note is a whole note).

- **FR-2** Random lessons draw a **new order on every start** (Phase 4 behaviour), and the same step never comes twice in a row (the same note, or the same chord / interval).
- **FR-3** Every lesson in the catalog must, for its base octave: use only white keys, stay inside the computer-keyboard window (FR context), and have at least one step. A unit test checks this for the whole catalog.
- **FR-4** Every melody is split into **phrases** (from the tune's structure, at most 8 notes each). Random lessons are split into pages of at most 8 steps, as even as possible (20 → 7 + 7 + 6; 12 → 6 + 6).
- **FR-5** A pure function picks the **next suggested lesson**: the first lesson in catalog order that has no finished run. When every lesson has at least one run, there is no suggestion.

**Staff row**

- **FR-6** While a lesson runs, the staff shows the **current page** (phrase): all its steps in a row, left to right, on the grand staff. Every note goes on its clef (C4 and above treble, below bass) with ledger lines as in Phase 4.
- **FR-7** Steps are coloured by state: **played** steps are grey, the **current** step is highlighted (blue), and **upcoming** steps are black. Inside a chord, the notes already played right are green; the rest of the chord stays highlighted.
- **FR-8** A **chord / interval** is drawn as noteheads stacked at one x position. When two notes of a step are a second apart (adjacent staff positions on the same clef), the upper one is drawn to the right of the lower one, as in standard engraving. The notes of a step can be on different clefs (for example B3 + D4).
- **FR-9** Right / wrong feedback (Phase 4) still flashes the played key on the piano and colours the step on the staff: green for a right note (the step that was just completed), red on the current step for a wrong note. When the last step of a page is played right, the completed page stays visible for the flash, then the next page is shown.
- **FR-10** The staff's accessible label names the current target in the UI language: one note ("Target note: E") or all notes of a chord ("Target notes: C, E, G"), using `i18n/noteNames.ts`.
- **FR-11** The row stays readable at 360 px width with 8 steps: the staff scales to the container width, and noteheads and ledger lines don't overlap between steps.

**Lesson screen**

- **FR-12** The instruction under the title fits the lesson: single-note lessons say "Play the highlighted note. The row shows what comes next."; lessons with chords say "Play all notes of the highlighted chord, together or one after another." (translated). The judge is unchanged: a chord's notes can be played in any order, one at a time; a note outside the step is a mistake (Phase 4).
- **FR-13** The progress counter, summary, stars, XP, and streak work for every lesson as in Phases 4–5. A right note in a chord counts as one correct note.

**Home**

- **FR-14** Home shows the lessons **grouped by unit**: a heading per unit, then its lesson cards in order (Phase 5 card: title, best stars, best accuracy / "Not played yet", runs, Start).
- **FR-15** The suggested lesson (FR-5) shows a **"Next"** badge (a word, not colour only). All lessons can be started at any time; nothing is locked.

**Translations**

- **FR-16** Every new string (unit headings, lesson titles, instructions, labels, the badge) exists in `en`, `uk`, `de`, `fr`. Tune titles use the name the tune is known by in that language (for example "Ode an die Freude", "Ah ! vous dirai-je, maman" for Twinkle in French).

## Non-functional requirements

- User-facing text goes through the translations module (English default; add keys for `uk`, `de`, `fr` too).
- Works with the on-screen and computer keyboard (no MIDI device required); every chord can be played with the computer keyboard (no more than three keys at once).
- No perceptible added input latency: the judge path is unchanged; the row layout is computed from the lesson, not per note event.
- Pure core: curriculum data, generators, paging, the next-lesson rule, and the staff-row geometry (x positions, chord offsets, ledger lines) live in `src/core/` with unit tests. `StaffView` only turns positions into SVG.
- No colour-only signals: the current step is also marked by position in the row and the accessible label; the badge is text.
- No change to the saved progress format.
- No new runtime dependencies.

## Out of scope

- Locked lessons / unlock gates (decided: no locks). A note goes to the backlog in case it is wanted later.
- Rhythm, note values, stems, bars, time signatures, tempo, a metronome.
- Accidentals, key signatures, black-key content.
- Hands together (both hands at the same time), fingering numbers, hand-position hints on the keyboard.
- Chord inversions, seventh chords, naming the interval or chord in the UI (a quiz).
- Adaptive practice, spaced repetition, lesson descriptions or previews on Home.
- Lessons wider than the computer-keyboard window (needs the keyboard-size / responsive keyboard backlog items).

## Decisions

| Question                                      | Decision                                                                                                   | Reason                                                                                                      |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| How much of the curriculum                    | Everything in Phase 6: single notes, both hands separately, melodies, intervals and chords                 | User choice; the phase stays one PR. Risk: the largest phase so far (see `plan.md`).                        |
| Melody view                                   | A row of notes (a phrase, up to 8 steps); current step highlighted, played steps grey                      | Read ahead like sheet music; tunes become recognisable.                                                     |
| Unlock rule                                   | No locks; lessons are shown in order                                                                       | User choice: nothing blocks the learner.                                                                    |
| Home layout                                   | Grouped by unit with headings                                                                              | The curriculum structure is visible.                                                                        |
| Row view for random lessons _(agent default)_ | Yes, every lesson uses the row (pages of ≤ 8 steps)                                                        | One staff component, and reading ahead helps in drills too.                                                 |
| Order hint _(agent default)_                  | A "Next" badge on the first lesson without a finished run                                                  | Keeps "order tied to progress" from the roadmap without locks; pure and testable.                           |
| Chord judging _(agent default)_               | Unchanged from Phase 4: notes of a chord in any order, one at a time, no timing window                     | Works on touch and computer keys; beginner-friendly. A "together within N ms" rule can come later.          |
| Content range _(agent default)_               | White keys only, inside the computer-keyboard window of the lesson's base octave                           | No accidentals on the staff yet; mission principle 4.                                                       |
| Existing lesson _(agent default)_             | Keeps id `note-reading` and its content; title becomes "Around middle C"; placed second in the treble unit | Old saved results stay valid; no progress migration.                                                        |
| Melodies _(agent default)_                    | Mary Had a Little Lamb, Ode to Joy (A + A′), Twinkle Twinkle; Ode to Joy also for the left hand; no rhythm | Well-known, public domain, fit C4–A4 white keys; the left-hand copy covers "hands separately" for melodies. |
| Step lengths _(agent default)_                | 20 notes for random note lessons, 12 steps for interval and chord lessons                                  | Same as Phase 4 for notes; chords take longer per step.                                                     |
