# Requirements — Real notation: several voices per staff

## Context

Roadmap Phase 16, the last of the three "real notation" phases split by the user during the Phase 14 spec (14 key signatures and spelling ✅, 15 beams ✅, 16 several voices). Today the score is a reduction with **one voice per staff**: notes that start together form a chord, and each chord lasts until the next one starts. When a staff has a held note under a moving melody (or two independent lines), the held note is cut short and both lines are drawn as one rhythm, so the score looks different from MuseScore.

MusicXML files say which **voice** each note belongs to (`<voice>`; MuseScore exports always do, for example voices 1 and 5 in a two-staff piano part). The library MIDI files do not: their tracks are split by staff, not by voice. So this phase draws voices **where the file states them** and leaves MIDI as it is.

Only the notation changes. Pitches, playback, judging, course steps and lesson ids, and saved progress stay as they are.

The answers to the clarifying questions are in **Decisions** below.

## Functional requirements

### Reading voices

- **FR-1** MusicXML: each note keeps its `<voice>`. Within one staff of one part, the voices are ranked by their number: the first is the **upper voice**, the second the **lower voice**. A third or fourth voice is merged into whichever of the two has the closer average pitch. A note without `<voice>` belongs to the first voice. MIDI notes have no voice: their staff stays one voice, as today.
- **FR-2** Different parts that land on the same staff (for example a single-staff melody part by the middle-C split) are not voices of each other: each part's first voice is the upper voice of that staff, as today.

### Drawing two voices

- **FR-3** In a bar where a staff has notes in **both** voices, each voice is laid out with its own rhythm: the upper voice's stems point **up**, the lower voice's stems **down**; a held note in one voice lasts its full length while the other voice moves. In a bar where only one voice has notes, that voice is drawn as today (stem direction by position).
- **FR-4** Rests: the upper voice's rests are drawn as today (moved up a little in a two-voice bar). The lower voice's rests are drawn (moved down) only in bars where the lower voice has notes; in a bar where it has none, nothing is drawn for it.
- **FR-5** When notes of the two voices start together on the same or a neighbouring staff position, the lower voice's noteheads move one notehead to the right so they don't overlap; the layout makes room for it.
- **FR-6** Beams (Phase 15) are built per voice: a group never joins notes of different voices, and its stems keep the voice's direction. Ties join notes of the same voice. Accidentals keep the staff rule: a sign holds for the rest of the bar on that staff position, whichever voice wrote it.
- **FR-7** Playback, the cursor, the blue sounding notes, and seeking work as before; a held note of the lower voice stays blue for its whole length.

### Where it shows

- **FR-8** The Player shows voices for MusicXML files. MIDI files and the library look as today.
- **FR-9** Course lessons of a MusicXML piece show the voices in their notation. The lessons themselves don't change: a step is still every note that starts at the same moment in that hand, whatever its voice, so lesson ids, step counts, and saved stars stay the same.

## Non-functional requirements

- Pure core: voice ranking (in the MusicXML reader), the per-voice layout of a staff (spans, rests, stem direction, collisions), and the per-voice beams live in `src/core/` without React, DOM, or audio imports, and are unit-tested.
- No new runtime dependencies, glyphs, or user-facing strings.
- A score without voices (every MIDI file) is built exactly as before; the tests that build every library piece and its course keep passing, and a test shows a one-voice score is unchanged.
- Opening a 2 MB file stays under a second.

## Out of scope

- Guessing voices for MIDI files (split by rhythm).
- More than two drawn voices per staff; voices crossing between staves (cross-staff notes).
- Shared noteheads for a unison of two voices, voice-specific dot placement beyond moving the lower voice, courtesy rests.
- Tuplets, grace notes, and other items in the notation backlog.

## Decisions

| Question                             | Decision                                                                                | Reason                                                                                           |
| ------------------------------------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Where do voices come from?           | **MusicXML `<voice>` only.** MIDI and the library stay one voice per staff.             | User choice. Reliable; the library MIDI tracks are per staff, so there is nothing to read there. |
| How many voices per staff?           | **Up to two** (upper stems up, lower stems down); voices 3–4 merge into the nearer one. | User choice. Covers almost all piano music without a complex collision layout.                   |
| Rests of the lower voice             | **Only in bars where the lower voice has notes.**                                       | User choice. Like most editions; no rests for a voice that is silent for the whole bar.          |
| Voices of different parts on a staff | Not voices of each other; each part's first voice is the upper voice.                   | Agent default. Keeps the Phase 13 merging of parts unchanged.                                    |
| Colliding noteheads                  | The lower voice moves one notehead right on the same or a neighbouring position.        | Agent default. Standard engraving; no shared noteheads.                                          |
| Course steps                         | Unchanged: every note starting at a moment, whatever its voice.                         | Agent default. Lessons judge pitches; ids and saved progress must not change.                    |
