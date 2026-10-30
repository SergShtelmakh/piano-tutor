# Requirements — Real notation: beams

## Context

Roadmap Phase 15, the second of three "real notation" phases (Phase 14 key signatures and spelling, Phase 15 beams, Phase 16 several voices per staff; split by the user during the Phase 14 spec). Today every eighth and sixteenth note in the score view has its own flag, so a run of eighths looks very different from printed music (compare the user's `Pitces Of Memory.mxl` with musescore.com, where the right hand is beamed in pairs).

This phase joins eighth and sixteenth notes by **beams** within a beat. It changes only the drawing of the score view (`ScoreView`: the Player and course lessons). The score model, playback, judging, course ids, and saved progress stay as they are. The built-in lessons (`StaffView`) show whole notes and need nothing.

The answers to the clarifying questions are in **Decisions** below.

## Functional requirements

### Which notes are beamed

- **FR-1** On each staff, consecutive note columns (chords count as one) with a value of an eighth or a sixteenth (dotted or not) are joined by a beam when they lie in the **same beat** of the same bar. A group needs at least two columns; a single eighth or sixteenth keeps its flag.
- **FR-2** The beat depends on the time signature: a quarter note in x/4 (2/4, 3/4, 4/4, 5/4 …), a half note in x/2, a dotted quarter in compound metres (6/8, 9/8, 12/8) and the whole bar in 3/8, and a quarter in other x/8 and x/16 metres. Beats are counted from the start of the bar.
- **FR-3** A rest, a quarter note or longer, or a bar line ends a group. Ties do not: a tied eighth is beamed like any other.
- **FR-4** Beams are built by this rule for every file, MIDI and MusicXML alike; `<beam>` elements in a MusicXML file are ignored.

### How a beam looks

- **FR-5** All stems of a group point the same way: down when the notes of the group sit at or above the middle line of their staff on average (the same rule as for a single column today, applied to the whole group), up otherwise. A beamed column has no flag.
- **FR-6** The primary beam joins the ends of the first and last stem. It slopes in the direction from the first to the last note of the group, at most **one staff space** over its length; it is flat when the first and last notes are at the same height. Every stem of the group keeps at least the usual minimum length (the beam moves away from the notes when needed).
- **FR-7** Where two neighbouring columns of a group are both sixteenths, a second beam joins them. A sixteenth with no sixteenth beside it (for example after a dotted eighth) gets a short second beam (a hook) pointing towards its neighbour in the group.
- **FR-8** Ties, dots, accidentals, the cursor, the blue sounding notes, and seeking keep working on beamed notes; a tie sits on the side opposite the group's stems.

### Where it shows

- **FR-9** The Player shows beams for MusicXML and MIDI files and for the library pieces. Course part and merge lessons show them too (they use the same view); drills are quarter notes and have none.

## Non-functional requirements

- Pure core: grouping (beats per metre, groups per bar and staff, the stem direction of a group, secondary beams and hooks) and the beam geometry (slope limit, minimum stem length, the beam height at each stem) live in `src/core/` with no React, DOM, or audio imports, and are unit-tested.
- No new runtime dependencies; no new glyphs (beams are drawn as SVG shapes).
- No new user-facing strings.
- The layout of bars and systems (`scoreLayout`) does not change; beams are drawn inside the existing columns.
- The test that builds the course of every library piece keeps passing.

## Out of scope

- Several voices per staff (Phase 16), so no beams that cross a voice or a staff.
- Beams from the MusicXML file, beams over rests, beams across bar lines, beams over a half bar in 4/4.
- Tuplets (and tuplet brackets), grace notes, thirty-second notes (the reduction rounds to sixteenths).
- Feathered beams, cross-staff beams, user-chosen grouping.

## Decisions

| Question                          | Decision                                                                                                             | Reason                                                                                                             |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| How to group notes under beams?   | **By beat**: a quarter in x/4, a dotted quarter in 6/8, 9/8, 12/8 (FR-2).                                            | User choice. Simple and predictable, like most beginner editions.                                                  |
| Use `<beam>` from MusicXML files? | **No**, compute for all files.                                                                                       | User choice. The score is a simplified reduction (one voice, sixteenths), so file beams often wouldn't match.      |
| Beam slope                        | **Gentle**: follows the first-to-last direction, at most one staff space.                                            | User choice. Closer to printed music than flat beams.                                                              |
| A rest inside a beat              | **Breaks the beam**.                                                                                                 | User choice. The easiest rule to read.                                                                             |
| Beat of other metres              | Half note in x/2; whole bar in 3/8; quarter in other x/8 and x/16 (5/8, 7/8, …).                                     | Agent default. Covers the library and common files without asymmetric groupings.                                   |
| Stems of a beamed group           | One direction per group by the average position; the stem is not cut at the edge of its staff (it reaches the beam). | Agent default. The space between the staves (Phase 14) leaves room; cutting stems would detach them from the beam. |
| Lone sixteenth in a group         | A short second beam (hook) towards its neighbour.                                                                    | Agent default. Standard engraving for a dotted eighth + sixteenth.                                                 |
