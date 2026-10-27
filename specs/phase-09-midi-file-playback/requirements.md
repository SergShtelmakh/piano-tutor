# Requirements — MIDI file playback

## Context

Roadmap Phase 9, from the backlog item "Load a `.mid` file and play it step by step (custom MIDI parser)". The learner opens a `.mid` file and the app **plays it**: the notes appear on the grand staff as sheet music, a cursor moves along the staff while the music plays, and the piano keys that sound right now light up blue. Keyboard size and calibration (the old Phase 9) moved to Phase 10.

What exists today and what this phase has to add:

- **Note pipeline.** Every source emits `noteon` / `noteoff` / `sustain` into one bus (`src/input/noteBus.ts`); the synth and the key highlight subscribe. The architecture rules already list "playback" as a source. A file player is one more source (`'playback'`): the synth plays it and the held-key highlight (sky blue, the existing "held" colour of the on-screen piano) lights the keys, with no special code in either.
- **Parsing.** `src/core/midi.ts` parses live Web MIDI messages only. Standard MIDI Files (`.mid`) need their own parser (tracks, delta times, running status, meta events, tempo map). No library: `tech-stack.md` prefers small dependency-free code for domain logic.
- **Staff.** `staff.ts` / `staffRow.ts` / `StaffView` show **whole notes on white keys** in rows of at most 8 steps, built for lessons. Real files need **sharps, note values (stems, flags), rests, bar lines, ties, and many bars**. That is a new, separate view (`ScoreView`); the lesson staff stays as it is.
- **Piano.** Phase 8's piano shows the computer-keyboard range plus extra octaves for the width. A file can use keys outside it, so the piano must also show the piece's range, and on narrow screens follow what is playing.

Terms used below:

- **Piece:** the parsed file: notes with start / end in ticks and in seconds, the tempo map, time signatures, and sustain-pedal events.
- **Score:** the sheet-music reduction of a piece: bars, staves, columns of notes, rests. **Playback does not use the score.** It uses the exact times from the piece, so the sound is faithful even where the notation is a simplification.
- **System:** one line of bars on the grand staff.
- **Cursor:** the vertical line across both staves at the current playback position.

The clarifying questions and their answers are in the **Decisions** table. Rows marked _(agent default)_ were not asked; please review them.

## Functional requirements

**Opening files**

- **FR-1** The mode switch gets a third mode, **Player**, after Home and Free play. It shows an **Open MIDI file** button, the name of the loaded file, the score, the controls, and the piano. With no file loaded it shows a short hint instead of the score.
- **FR-2** **Open MIDI file** opens the system file chooser for `.mid` / `.midi` files. The file is read in the browser and never uploaded. Choosing another file replaces the current one (playback stops first). Cancelling the chooser changes nothing. There is no drag and drop and no built-in example.
- **FR-3** The parser reads Standard MIDI Files of **format 0 and format 1** with ticks-per-quarter timing. It handles running status, note-on with velocity 0 as note-off, tempo changes, time-signature changes, and the sustain pedal (controller 64). All tracks are merged into one piece. **Percussion (channel 10) is ignored.** A note that is never closed ends at the end of the file.
- **FR-4** Files that can't be shown give a clear, translated message under the button and leave the current piece untouched. The cases are:
  1. not a MIDI file (no `MThd` header);
  2. unsupported (format 2, or SMPTE timing);
  3. no notes (empty, or only percussion);
  4. too large (over 2 MB, over 50,000 notes, or longer than four hours);
  5. damaged (the data ends early or is inconsistent).

**Notation (the score)**

- **FR-5** The score is a grand staff (treble and bass clef, as in lessons: C4 and above on the treble staff, lower notes on the bass staff) with:
  - **sharps** (♯) for black keys, drawn before the notehead; there are no flats and **no key signature**. Within a bar, a note that follows a sharped note of the same staff position gets a natural (♮) when it is not sharped, and a repeated sharp isn't drawn again;
  - **note values**: whole and half notes (open noteheads), and quarter notes and shorter (filled), stems, flags for eighths and sixteenths, and augmentation dots;
  - **rests** for gaps;
  - **bar lines**, the **time signature** at the start and wherever it changes, and **ties** for notes that cross a bar line or need two values;
  - chords as stacked noteheads, with seconds side by side, as in Phase 6.
- **FR-6** The notation is a **simplified reduction**, not an exact transcription: starts and ends are rounded to the nearest sixteenth note; each staff is one voice (a note is shown until the next note on that staff begins, or for its own length if that is shorter); triplets and other tuplets are rounded to the sixteenth grid; no beams, grace notes, ornaments, dynamics, or pedal marks. **Playback is not affected** by any of this (FR-10).
- **FR-7** Bars are wrapped into **systems** to fit the width of the score box (fewer bars per system on a phone). Each system starts with the clefs. The score shows the **current system and the next one**; when the cursor passes into the next system, the view advances so that system becomes the first. At 360 px width a system is readable, with no horizontal page scroll. In the rare case that one bar is too dense to fit, the score box scrolls sideways and follows the cursor.
- **FR-8** The **cursor** moves smoothly across the staves during playback. Its x position is interpolated between the notes, so it keeps moving through long notes and rests. Notes that are sounding at the cursor are drawn **blue** (in the score too); played notes stay black. While paused the cursor stays; after Stop it is at the start.
- **FR-9** The score has an accessible label naming the file and its number of bars (translated, with plural forms), and the cursor is not announced.

**Playback**

- **FR-10** **Play**, **Pause**, and **Stop** buttons (one Play / Pause toggle plus Stop). Playing emits `noteon` / `noteoff` / `sustain` events on the note bus with source `'playback'`, using the **exact timing and velocities of the file**, and honouring the sustain pedal. Events are emitted within 20 ms of their time with **no accumulating drift** over a long piece. When the piece ends, playback stops, all notes are released, and the position goes back to the start. Pause, Stop, seeking, loading another file, and leaving the Player release every note that playback holds, so nothing sounds on.
- **FR-11** A **tempo** slider from 50 % to 150 % in steps of 5 %, default 100 % (the file's own tempo, including its tempo changes). Changing it while playing takes effect at once and keeps the position.
- **FR-12** **Seeking:** a **position slider** (with the elapsed and total time as `m:ss`) and a click or tap on the score (it jumps to the nearest note or rest in that bar and system). Seeking works while playing (playback continues from the new place) and while paused (it stays paused). Keys held by playback are released on a seek.
- **FR-13** Playback and live playing mix: keys pressed on the computer keyboard, the on-screen piano, or a MIDI keyboard still sound and light up while a file plays. Playback itself never reaches a lesson (lessons are a different screen).

**Piano**

- **FR-14** While a piece is loaded, the keys of the notes sounding now are **blue** (the same colour as keys you hold). The on-screen piano shows the piece's whole note range when that fits at the usual key width (the existing 40 px rule); otherwise it shows as much as fits, and on narrow screens the view **scrolls to bring the sounding notes into view**. Notes below A0 or above C8 are played but have no key. The piano scrolls along playback even though notes are "held"; it still never scrolls while the learner holds a key down with a finger or the mouse (Phase 8 FR-5).
- **FR-15** Leaving the Player (switching to Home or Free play) stops playback and releases its notes. Changing the language keeps the loaded file and position.

**Translations**

- **FR-16** Every new string (mode label, button labels, control labels, hint, the five error messages, the score label with bar count) exists in `en`, `uk`, `de`, `fr`. Note names in labels use `i18n/noteNames.ts`.

## Non-functional requirements

- User-facing text goes through the translations module (English is the default; `uk`, `de`, and `fr` get the keys too).
- Works with the on-screen and computer keyboard (no MIDI device required).
- Pure core: the parser, the score builder (quantising, bars, ties, rests, accidentals), the system layout and the time-to-x map, and the playback schedule live in `src/core/` with unit tests and no React, DOM, or audio imports. Tests build their MIDI bytes in code. The player hook, `FileReader`, timers, and SVG stay in thin adapters and components.
- One note pipeline: playback only emits bus events; the synth and the highlight are not changed for it (the held colour is already blue).
- Privacy: the file stays on the device, and nothing is stored (the loaded file is not remembered after a reload).
- Performance: parsing a 1 MB file takes well under a second, and the score builds once per file (and once per width change). Only the two visible systems are drawn, so a long piece doesn't slow the page. Playing adds no perceptible input latency to live playing.
- No colour-only signals: the current position is also the cursor line and the position slider, and playing / paused is shown by the button label.
- No new runtime dependencies.

## Out of scope

- Playing along with a file: waiting for the learner's notes, judging, scoring, XP (a later phase; stays in the backlog).
- Looping a section, a metronome or count-in, muting a hand or a track, per-track volume or instrument.
- Key signatures and flats, beams, tuplets, grace notes, several voices on one staff, dynamics, pedal marks, lyrics, text, and repeats (shown as written, played as written).
- Drag and drop, a built-in example file, a recent-files list, remembering the file after a reload, PWA file handling (opening `.mid` from the OS), URL loading.
- Exporting, editing, or recording; MIDI format 2 and SMPTE timing.
- A scrollable overview of the whole score (only the position slider shows the whole piece).
- Changing the lesson staff (`StaffView`) or lessons.

## Decisions

| Question                                | Decision                                                                                                  | Reason                                                                                        |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Notation detail                         | Sharps, note values (stems, flags), rests, bar lines with time signature, ties; no key signature or beams | User choice: the score should look like real sheet music.                                     |
| Layout of a long piece                  | Systems (lines) like printed music; the cursor moves along a line and the next line scrolls into view     | User choice.                                                                                  |
| Opening files                           | A button only (system file chooser)                                                                       | User choice: simplest; drag and drop and an example can come later.                           |
| Controls                                | Play / pause / stop, tempo (50–150 %), seeking (slider and click on the score)                            | User choice. Loop and hand muting are out of scope.                                           |
| Phase numbering _(agent default)_       | This is Phase 9; keyboard size and calibration became Phase 10                                            | The user asked for this as the next phase.                                                    |
| Percussion _(agent default)_            | Channel 10 is ignored; all other channels and tracks are merged into one piano                            | The player is a piano; drums would only add noise and fake notes on the staff.                |
| Hands _(agent default)_                 | The staff is chosen by pitch (C4 and up is treble), not by track                                          | Same rule as lessons; piano files often put both hands in one track.                          |
| Playback timing _(agent default)_       | Playback uses the original tick-to-seconds times; only the notation is rounded                            | Quantising is for reading; it must not change how the piece sounds.                           |
| Visible systems _(agent default)_       | Two systems are drawn (current and next); the view advances                                               | Bounds the work for long pieces on phones; the slider gives the overview.                     |
| Cursor and notes _(agent default)_      | A vertical line interpolated between notes, plus blue sounding noteheads                                  | The lesson staff already marks the current step blue; consistent with the blue piano keys.    |
| Limits _(agent default)_                | 2 MB and 50,000 notes                                                                                     | A normal piano file is well under 200 KB; the limit protects phones from a pathological file. |
| Mode name _(agent default)_             | "Player" (uk "Програвач", de "Player", fr "Lecteur")                                                      | Short enough for the mode switch at 360 px.                                                   |
| Tab in the background _(agent default)_ | No special handling; browsers slow timers in hidden tabs, so playback can stutter there                   | Keeps the engine simple; see Risks in `plan.md`.                                              |
