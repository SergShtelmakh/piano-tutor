# Requirements — MusicXML import

## Context

Roadmap Phase 13, a new phase requested by the user. MuseScore saves scores as `.mscz` and exports them as **MusicXML**: compressed `.mxl` (a zip with the XML inside) or uncompressed `.musicxml` / `.xml`. The Player (Phase 9) opens only Standard MIDI Files, and courses (Phase 11) can be built only from library pieces. A MIDI export loses which staff a note was written on, so the course splits the hands at middle C and a melody that crosses it lands in the wrong hand (known debt in `tech-stack.md`).

This phase lets the learner open a MusicXML file from MuseScore in the Player, see and hear it like a MIDI file, and build a course from it. The file is turned into the same `Piece` model as a MIDI file, plus the hand of each note taken from the staff it is written on, so the score view, the player, and the course builder are reused. A course can also be built from the learner's own `.mid` file.

The answers to the clarifying questions are in **Decisions** below.

## Functional requirements

### Opening a file

- **FR-1** The Player's file chooser (renamed "Open file") must accept `.mid`, `.midi`, `.mxl`, `.musicxml`, and `.xml`. The format must be detected from the file's **content**, not its name: a MIDI header (`MThd`), a zip (`PK\x03\x04`) holding MusicXML, or XML text whose root element is `score-partwise`. The file never leaves the device.
- **FR-2** For a `.mxl` file the app must read the zip, find the score through `META-INF/container.xml` (its first `rootfile`), or, without one, the first `.musicxml` / `.xml` entry outside `META-INF/`, and decompress it (zip methods "stored" and "deflate"). No new dependency (the browser's `DecompressionStream`).
- **FR-3** Limits: the chosen file at most 2 MB (as for MIDI); the decompressed XML at most 20 MB; at most 50,000 notes and 4 hours (as for MIDI). A file over a limit shows the "too large" message.
- **FR-4** Errors must reuse the Player's error messages, without throwing: not a MIDI or MusicXML file → "not a supported file" (the old "not a MIDI file" message, reworded to name both formats); `score-timewise`, an encrypted zip, or another zip method → "not supported"; broken zip or XML → "damaged"; no pitched notes → "no notes". The previous piece stays open after an error.

### Reading MusicXML

- **FR-5** All parts of the score must be merged on one timeline (as all MIDI tracks are). Notes of unpitched (percussion) parts and `<unpitched>` notes are ignored.
- **FR-6** A note's pitch comes from `<pitch>` (`step`, `alter`, `octave`) and its timing from `<duration>` in the part's `<divisions>` (which may change inside a part). `<chord/>`, `<backup>`, and `<forward>` must be handled, so several voices and both staves of a piano part land at the right times. Rests move time on. A tied note (`<tie type="start|stop">`) sounds once, for the joined length. Grace notes and cue notes are skipped.
- **FR-7** Time signatures come from `<time>` (`beats` / `beat-type`); 4/4 when the file has none. A pickup bar (a first measure shorter than its time signature) must be padded with a rest at its start, so the bar lines of the score match the file.
- **FR-8** The tempo is fixed at 120 bpm (quarter note); tempo marks in the file are ignored. The Player's tempo slider (50–150 %) works as for MIDI. Repeats and voltas are not expanded: the piece plays once, as written. Velocity is fixed (dynamics ignored). The sustain pedal comes from `<pedal type="start|stop|change">` directions.
- **FR-9** Each note keeps its **hand**: in a part with two staves, staff 1 is the right hand and staff 2 the left hand. Notes of a part with one staff have no hand (split at middle C as for MIDI).

### Score and course

- **FR-10** The score view must draw a note with a hand on that hand's staff (right → treble, left → bass), with ledger lines when it is far from it, even across middle C. Notes without a hand keep the middle-C split. Everything else in the score view is unchanged (the Phase 9 reduction: one voice per staff, sharps, rounding to sixteenths).
- **FR-11** The course builder must use the same staff assignment, so a course built from a MusicXML file puts each note in the hand it was written for.
- **FR-12** When a file from the learner's disk is open in the Player (MIDI or MusicXML), a **Learn** button must sit next to its name and open the course screen for it, with the same stages and lessons as a library piece. The course screen shows the file name as the title and no composer, portrait, or difficulty. Its **Open in Player** goes back to the Player with the same piece still open.
- **FR-13** Lessons of such a course must give XP, update the streak, and save stars and best accuracy like other lessons, under ids built from a hash of the file's content (`melody:file-<hash>:…`), so opening the same file again shows its stars again. The piece must **not** appear in "Pieces you are learning" on Home, because the file is not kept.

## Non-functional requirements

- User-facing text goes through the translations module (English default; add keys for `uk`, `de`, `fr` too).
- Works with the on-screen and computer keyboard (no MIDI device required).
- No perceptible added input latency; a 2 MB `.mxl` opens in under a second on a mid-range laptop.
- The zip reader, the XML reader, and the MusicXML conversion are pure (`src/core/`), never throw on bad input, and are unit-tested. Only the decompression (`DecompressionStream`) lives in the adapter.
- No new runtime dependencies (architecture rule 6: a small in-house XML reader instead of a library; `DOMParser` is a DOM API and is not available in the `node` test environment).
- The saved progress format is unchanged (`version: 1`). Library pieces keep their course ids.

## Out of scope

- MusicXML in the library (the content policy allows only Public Domain MIDI files from Mutopia).
- `.mscz` (MuseScore's own format) and `score-timewise`.
- Real notation from the file: key signatures, flats as written, several voices per staff, beams, tuplets, dynamics, articulations, lyrics.
- Tempo marks, repeats / voltas / D.C. / D.S., grace notes, dynamics as velocity.
- Keeping opened files on the device (IndexedDB) and showing them on Home.
- Drag and drop.

## Decisions

| Question                                     | Decision                                                                                                        | Reason                                                                                                                            |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Where does the phase go?                     | Phase 13, after Phase 12 (keyboard size). The Phase 12 spec was committed on its own branch first.              | User choice. Keeps Phase 12 as planned.                                                                                           |
| Where do MXL files work?                     | Player (open, view, play) and Learn (a course from the opened file).                                            | User choice. MXL in the library is out: Mutopia rarely ships it, and the licence policy allows only Mutopia Public Domain pieces. |
| How much notation from the file?             | Notes, time signatures, pedal, and the **hand from the staff**. The score is drawn with the existing reduction. | User choice. Fixes the middle-C hand split for these files; real notation (key signatures, voices) would be its own phase.        |
| Uncompressed `.musicxml` / `.xml`?           | Yes.                                                                                                            | User choice; little extra code once the XML reader exists.                                                                        |
| Repeats, tempo marks, grace notes?           | Not in this phase: played once as written, 120 bpm, grace notes skipped.                                        | User choice (not picked). Added to the backlog.                                                                                   |
| Progress of a course from the learner's file | XP, streak, and stars are saved under `melody:file-<content hash>:…`; the piece is not shown on Home.           | User choice. The file is not kept, so Home could not reopen it.                                                                   |
| Learn for the learner's own `.mid`?          | Yes, for any file opened from disk.                                                                             | User choice; same code path. Hands still split at middle C for MIDI.                                                              |
| Several parts (piano + voice, …)?            | All non-percussion parts merged; hand from the staff in two-staff parts, middle-C split for one-staff parts.    | User choice; matches how MIDI tracks are merged.                                                                                  |
| Pickup bar                                   | Padded with a rest at the start of the first bar.                                                               | Agent default: keeps bar lines (and course parts) aligned with the file without a new field in `Piece`. Check at review.          |
| Format detection                             | By content (magic bytes / root element), not by extension.                                                      | Agent default: MuseScore exports `.xml` and `.musicxml` interchangeably, and renamed files still work.                            |
