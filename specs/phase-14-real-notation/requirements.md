# Requirements — Real notation: key signatures and spelling

## Context

Roadmap Phase 14, requested by the user after validating Phase 13 with a real MuseScore export (`Pitces Of Memory.mxl`, five flats). The pitches and hands were read correctly, but the score looked very different from MuseScore:

- no key signature, so every black key got its own sign before the note;
- every black key spelled with a sharp (D♭ drawn as C♯), with naturals to cancel them;
- the treble and bass staves are only one ledger line apart, so a left-hand chord above middle C seems to sit on the treble staff.

The "real notation" work is split into three phases (user decision): **Phase 14** key signatures, spelling, and the space between the staves; **Phase 15** beams; **Phase 16** several voices per staff. This phase covers both score drawings: `ScoreView` (Player and course lessons) and `StaffView` (the built-in lessons).

Only the way notes are written changes. Pitches, playback, judging, lesson ids, and saved progress stay as they are.

The answers to the clarifying questions are in **Decisions** below.

## Functional requirements

### Reading the key and the spelling

- **FR-1** MusicXML: the key comes from `<key><fifths>` (−7 … 7; the first `<key>` seen at a time wins, as for time signatures); a change inside the piece is kept with its position. Without a `<key>`, the piece is in C (0). Each note keeps the spelling written in the file (`<step>` and `<alter>`), so D♭ stays D♭. In a part with `<transpose>`, the written step is moved by `<diatonic>` (and `<octave-change>`) along with the pitch.
- **FR-2** MIDI: the key comes from the key-signature meta event (`FF 59`, `sf` = −7 … 7); changes are kept. Without one, the piece is in C. MIDI has no spelling, so a black key is spelled with a flat in a key with flats (fifths < 0) and with a sharp otherwise. This applies to the library pieces and to the learner's own `.mid` files.
- **FR-3** A double sharp or double flat in a file (alter ±2), or any spelling that cannot be drawn, is drawn as the nearest single spelling of the same pitch (for example F𝄪 as G). The pitch never changes.

### The score

- **FR-4** The key signature is drawn on both staves after the clef at the start of **every system**, and at the start of a bar where the key changes. Sharps and flats sit at their standard places (treble: F C G D A E B for sharps, B E A D G C F for flats; the bass staff the same, two octaves lower). C major / A minor draws none. Cancelling naturals at a key change are not drawn.
- **FR-5** A sign is drawn before a note only where the key signature and the earlier notes of the same bar on that staff position don't already give its alteration: a sharp, a flat, or a natural. As before, the sign holds for the rest of the bar on that staff position, and a note tied from the previous column repeats nothing.
- **FR-6** Notes are placed by their spelling: D♭4 sits on the D position with a flat (in a flat key, without one), not on C with a sharp.
- **FR-7** The space between the treble and the bass staff is at least **4 staff spaces** (today: 2) and grows so that the notes written between them never overlap: the lowest notes of the treble staff (with their ledger lines) and the highest notes of the bass staff (with theirs) keep at least one staff space apart. The space is the same for the whole piece (no jumping between systems).
- **FR-8** The system layout makes room for the key signature, so the first notes of a bar never overlap it, on any screen width.

### Where it shows

- **FR-9** The Player shows the new notation for MusicXML and MIDI files and for the library pieces.
- **FR-10** Course lessons show the key and spelling of their piece: part and merge lessons draw their bars as above; the notes and chords drills use the key at the start of the piece.
- **FR-11** The built-in lessons (`StaffView`) use the same spelling, key-signature, and staff-space code. Their notes are white keys in C major today, so they look the same apart from the wider space between the staves.
- **FR-12** Note names outside the staff do not change: the keys of the on-screen piano, the spoken labels of the current step, and the out-of-range notice keep their current names (with sharps).

## Non-functional requirements

- Pure core: the key signature model, the spelling rules, the accidental rule, the key-signature positions, and the staff-space computation live in `src/core/` with no React, DOM, or audio imports, and are unit-tested.
- No new runtime dependencies. The flat glyph is an outline from the Bravura font (SIL OFL 1.1, already credited), like the sharp and natural.
- The score still opens a 2 MB file in under a second; the layout stays per system as today.
- The tests that build the course of every library piece from its real file keep passing; lesson ids and the saved progress format (`version: 1`) are unchanged.
- No new user-facing strings are expected; any that appear go through the translations module (`en`, then `uk`, `de`, `fr`).

## Out of scope

- Beams (Phase 15) and several voices per staff (Phase 16).
- Cancelling naturals at a key change, courtesy accidentals, double sharps and flats as glyphs, modes beyond major / minor in the signature (the `mode` is ignored; only `fifths` is drawn).
- Note names outside the staff following the spelling (FR-12).
- Tuplets, dynamics, articulations, lyrics, tempo marks, repeats (backlog).

## Decisions

| Question                         | Decision                                                                                                | Reason                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| What goes into "real notation"?  | Key signatures + flats, beams, space between staves, several voices — **split into Phases 14, 15, 16**. | User choice. Everything at once would be ~8–9 task groups; one phase = one small PR.              |
| Phase 14 scope                   | Key signatures, spelling (flats), the space between the staves, `StaffView` too.                        | User choice (split option "14: keys, 15: beams, 16: voices").                                     |
| Spell MIDI files by their key?   | **Yes**: read `FF 59`; flats in flat keys, sharps otherwise.                                            | User choice. The Mutopia library files carry their key, so they look closer to the printed score. |
| Note names outside the staff     | **Unchanged** (sharps).                                                                                 | User choice. A piano key has no single spelling of its own.                                       |
| Built-in lessons (`StaffView`)   | **Also** on the shared spelling / key / staff-space code.                                               | User choice. No visible change except the space between the staves (white keys in C).             |
| Minimum space between the staves | 4 staff spaces, more when notes between the staves need it; one value per piece.                        | Agent default. Close to engraving practice; a per-piece value keeps the view from jumping.        |
| Double sharps / flats            | Drawn as the nearest single spelling.                                                                   | Agent default. Rare in learner material; avoids two more glyphs and their layout.                 |
| Spelling of MIDI black keys      | By the sign of the key only (flats if fifths < 0).                                                      | Agent default. Simple and right for the common keys; a full harmonic speller is out of scope.     |
