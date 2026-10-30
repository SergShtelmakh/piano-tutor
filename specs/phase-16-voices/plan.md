# Plan — Real notation: several voices per staff

> Roadmap phase: Phase 16 — Real notation: several voices per staff
> Branch: `feature/voices`
> Status: Implemented (manual validation open)

## Goal

A staff that has two voices in a MusicXML file is drawn with both rhythms — the upper voice with stems up, the lower with stems down — instead of one merged rhythm; MIDI files look as before.

## Approach

- **Model (`smf.ts`)**: `PieceNote` gains `voice?: 1 | 2` (unset = the staff's only / upper voice). MIDI notes never set it.
- **MusicXML (`musicxml.ts`)**: read `<voice>` per note; after a part is read, rank its voices per staff by number (first → 1, second → 2) and merge a third or fourth voice into the one with the closer average pitch (FR-1). Notes of other parts keep their own ranking (FR-2).
- **Score (`score.ts`)**:
  - `QuantisedNote` and `Column` carry `voice: 1 | 2`. For each staff, notes are split by voice; voice 2 goes through the existing `spansOf` on its own, and its columns are kept only in bars where it has notes (FR-4).
  - In a bar where a staff has columns of both voices, every column of that staff gets `stem: 'up'` (voice 1) or `'down'` (voice 2) and voice-1 / voice-2 rests get a vertical `restShift` (up / down); otherwise `stem` stays unset and the existing `stemDirection` decides (FR-3).
  - Columns of a staff stay in one list sorted by `unit`, then voice, so the accidental pass (per staff position, FR-6), `measureBars`, `scoreLayout` slots (by unit), and `course.stepsOf` (by unit) keep working unchanged.
  - Collisions (FR-5): for two columns of different voices at the same unit, if the lowest note of voice 1 and the highest of voice 2 are within one staff step, voice 2's column gets `offset: true`.
  - With no voice-2 notes the output is identical to today (tested on a piece and on every library file).
- **Layout (`scoreLayout.ts`)**: a slot whose columns include an `offset` column gets the same extra room as a shifted second.
- **Beams (`beams.ts`)**: `beamGroups` walks each voice separately and uses the column's `stem` when set, so a group never mixes voices (FR-6).
- **Drawing (`ScoreView.tsx`)**: stem direction from `column.stem ?? stemDirection(...)`; an `offset` column draws its noteheads, accidentals, and stem one notehead to the right; rests move by `restShift`; ties look for the next column of the same voice. Cursor, blue notes, and seeking are untouched (FR-7).

## Task groups

1. **Voices in MusicXML**
   - [x] `PieceNote.voice`; `<voice>` in `musicxml.ts`; ranking per part and staff; merge of voices 3–4; notes without `<voice>`.
   - [x] Tests: two voices on one staff (1 and 2), MuseScore numbering on the lower staff (5 and 6 → 1 and 2), a third voice merged by pitch, two parts on one staff, MIDI notes without voice.
2. **Score with two voices**
   - [x] Per-voice spans and columns, `Column.voice`, `stem`, `restShift`, lower-voice columns only in bars where it plays, `offset` for colliding columns.
   - [x] Tests: held note under a moving melody (the held note keeps its length, stems up / down), a bar with only voice 1 (unchanged), a bar with only voice 2 (drawn as one voice), lower-voice rests only in its bars, accidentals shared on a staff position across voices, collision offset, a one-voice score equal to today's output, course steps of a two-voice score equal to the union of onsets.
3. **Layout and beams per voice**
   - [x] Slot room for `offset` columns; `beamGroups` per voice with the forced direction.
   - [x] Tests: beams never join voices; a beamed group in the lower voice has stems down; the room is added only where needed.
4. **Drawing**
   - [x] `ScoreView`: forced stems, offset columns, rest shifts, ties per voice.
   - [x] Render `trio.musicxml` (voices 1 and 5) and a two-voice MuseScore export with headless Chrome at a wide width and at 330 px, and compare with MuseScore.
5. **Gates**
   - [x] Run every gate; the library and all-library course tests pass unchanged.

## Files touched

| File                                                | Change                                                      |
| --------------------------------------------------- | ----------------------------------------------------------- |
| `src/core/smf.ts`                                   | `PieceNote.voice`                                           |
| `src/core/musicxml.ts`, `musicxml.test.ts`, helpers | `<voice>`, ranking per staff, merging                       |
| `src/core/score.ts`, `score.test.ts`                | Per-voice columns, `stem`, `restShift`, `offset`            |
| `src/core/scoreLayout.ts`, `scoreLayout.test.ts`    | Room for offset columns                                     |
| `src/core/beams.ts`, `beams.test.ts`                | Groups per voice, forced direction                          |
| `src/core/course.test.ts`                           | Steps of a two-voice score                                  |
| `src/components/ScoreView.tsx`                      | Forced stems, offset noteheads, rest shifts, ties per voice |

## New dependencies

None.

## Risks & open questions

- **Rounding to sixteenths** can make two voices that start a hair apart look simultaneous or not; the reduction already rounds, so this is the same behaviour per voice.
- **Ties across voices** in a file (rare) are dropped: a tie only joins notes of the same voice.
- **Visual density** at 330 px with two voices and accidentals: check that offset noteheads and their signs don't run into the next column.
