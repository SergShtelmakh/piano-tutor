# Plan — Lesson controls

> Roadmap phase: Phase 20 — Lesson controls
> Branch: `feature/lesson-controls`
> Status: Implemented (manual validation pending)

## Goal

In a lesson the learner can hear the page played at a chosen tempo, practise with a metronome, practise one hand of a both-hands piece while the app plays the other, pause, and see a ring on the key to play.

## Approach

- **Pure core**
  - `src/core/lesson.ts`: `judge` ignores events with source `playback` (FR-4). `Lesson` gets two optional fields filled by course lessons: `stepUnits` (the position of each step in sixteenths, for the rhythm) and `stepHands` (per step, the notes of the left hand; the rest is the right hand) — only for both-hands lessons.
  - `src/core/course.ts`: `stepsOf` also returns each step's `unit` and its left-hand notes (bass staff); `lessonFrom` passes them on.
  - New `src/core/practice.ts`:
    - `TEMPO = { min: 40, max: 200, step: 5, default: 80 }`, `stepTempo(bpm, direction)`.
    - `beatSeconds(bpm)`; `stepOffsets(lesson, from, to, bpm)` → seconds from the first step for each step in a range (one beat per step without `stepUnits`, else unit distance × a sixteenth) — the Listen schedule (FR-2).
    - `oneHandLesson(lesson, hand)` → `{ lesson, sourceIndex, accompaniment }`: the steps with only that hand's notes (empty steps dropped), the index of each kept step in the original, and for each kept step the other-hand chunks to play when it is done (`{ notes, offsetUnits }`: its own other-hand notes at 0, then the other-hand-only steps that follow, until the next kept step) (FR-6). The returned lesson keeps the id and title; `pages` are recomputed with `evenPages`.
    - `LessonSettings = { tempo, metronome, hint }` with `parseLessonSettings` / `serialiseLessonSettings` (versioned JSON, invalid → defaults).
- **Adapters**
  - `src/audio/synth.ts`: `click(at?)` — a short tone through the master gain (so volume and mute apply), scheduled on the audio clock; no note event, so it is not judged or highlighted.
  - New `src/lesson/sequencer.ts`: plays chunks `{ notes, at }` on the bus with source `playback` using timers; every note gets a `noteoff` (a short fixed length); `stop()` cancels the timers and releases whatever is sounding. One instance per lesson screen for Listen and the other hand.
  - New `src/lesson/useMetronome.ts`: while enabled and not paused, schedules `synth.click` on the audio clock with a small look-ahead (re-reads the tempo every tick).
  - New `src/lesson/settings.ts` (storage `piano-tutor.lessonSettings`, try/catch) + `context.ts` + `LessonSettingsProvider.tsx` (in `App.tsx`; Phase 21 will add fields).
  - `src/lesson/useLesson.ts`: options `hand` (builds the lesson with `oneHandLesson` when it is `left` / `right`), `paused` (the listener ignores events while paused), `onStepDone(sourceIndex)` (for the accompaniment); returns `sourceIndex` so Listen can start from the right place in the full lesson. The finish callback receives whether the run was one-handed.
- **UI**
  - `LessonScreen`: the header controls (`ListenButton`, `TempoControl`, metronome and hint toggles, `HandSwitch`, the Pause button) in one row from `wide` / `short`, two rows on a narrow phone; a `PauseOverlay` (Resume / Restart / Exit, focus moves into it and back); auto-pause on `visibilitychange`; Space toggles pause (ignored in text fields). The summary of a one-hand run shows the practice note and calls no `recordRun`.
  - `PianoKeyboard`: a `hints` prop draws a ring on those keys (the theme token `key-hint` on a white key, `accent` on a black one). The piano shows the range of the whole lesson, so the other hand's notes are on screen in a one-hand run.
  - New icons (pause, play, metronome, ear/listen, bulb/hint) in `icons.tsx`; new strings in all four locales.

## Task groups

1. **Pure rules and tests**
   - [x] `judge` ignores `playback`; `Lesson.stepUnits` / `stepHands`; `stepsOf` and `lessonFrom` fill them (tests in `lesson.test.ts`, `course.test.ts`).
   - [x] `src/core/practice.ts` + `practice.test.ts`: tempo steps and clamping, `stepOffsets` (built-in and with units), `oneHandLesson` (kept steps, dropped empty steps, accompaniment chunks and offsets, leading other-hand steps not played, chords split by hand, a unison note in both hands), settings parser.
2. **Audio, sequencer, settings**
   - [x] `synth.click`; `src/lesson/sequencer.ts` (timers, `noteoff` for every `noteon`, `stop` releases all); `useMetronome`.
   - [x] `src/lesson/settings.ts`, `context.ts`, `LessonSettingsProvider.tsx`, wired in `App.tsx`.
3. **Lesson hook**
   - [x] `useLesson`: `hand`, `paused`, `onStepDone`, `sourceIndex`; one-hand runs reported as practice; restart on hand change.
   - [x] Accompaniment through the sequencer on each finished step; everything stopped on pause, restart, hand change, finish, and unmount.
4. **Lesson screen**
   - [x] Header controls and the two-row phone layout; Listen (page from the current step, Stop); tempo; metronome; hint ring in `PianoKeyboard`; hand switch for both-hands course lessons.
   - [x] Pause button, overlay, auto-pause when hidden, Space; one-hand summary note; icons; strings (`en`, `uk`, `de`, `fr`).
5. **Wrap-up**
   - [x] `specs/tech-stack.md` (project layout: `practice.ts`, `src/lesson/` additions, `synth.click`; known debt); run `validation.md`.

## Files touched

| File                                                                                                    | Change                                                        |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `src/core/lesson.ts`, `lesson.test.ts`                                                                  | Ignore `playback`; optional `stepUnits`, `stepHands`          |
| `src/core/course.ts`, `course.test.ts`                                                                  | Steps carry their unit and left-hand notes                    |
| `src/core/practice.ts`, `practice.test.ts`                                                              | New: tempo, Listen schedule, one-hand lesson, settings parser |
| `src/audio/synth.ts`                                                                                    | `click`                                                       |
| `src/lesson/sequencer.ts`, `useMetronome.ts`, `settings.ts`, `context.ts`, `LessonSettingsProvider.tsx` | New adapters                                                  |
| `src/lesson/useLesson.ts`                                                                               | Hand, pause, step callback                                    |
| `src/App.tsx`                                                                                           | `LessonSettingsProvider`                                      |
| `src/components/LessonScreen.tsx`, `LessonSummary.tsx`, `PianoKeyboard.tsx`, `icons.tsx`                | Controls, overlay, practice note, hint ring, icons            |
| `src/components/LessonControls.tsx`, `PauseOverlay.tsx`                                                 | New                                                           |
| `src/i18n/locales/{en,uk,de,fr}.ts`                                                                     | New strings                                                   |
| `src/index.css`, `config/themeContrast.test.ts`                                                         | Only if the hint ring needs a new token                       |
| `specs/tech-stack.md`                                                                                   | Layout and debt                                               |

## New dependencies

None. Timers and the Web Audio clock are enough for a page-long Listen and a metronome.

## Risks & open questions

- **Timer accuracy:** Listen and the other hand use `setTimeout` on the note bus (the bus has no timestamps, see the known debt); a busy main thread can make them uneven. The metronome uses the audio clock with a look-ahead, so it stays steady.
- **Audio not started:** the first sound needs a user gesture; Listen and the metronome are started by a press, so the existing `resume` on gesture covers them.
- **Sustain pedal:** the other hand's notes are released by the sequencer; a held sustain pedal still prolongs them, as for any note.
- **Unison across hands:** a pitch written in both staves at once is judged for the chosen hand and not played again by the app.
- The header has many controls; the phone layout is checked only by rendering (no component tests).
