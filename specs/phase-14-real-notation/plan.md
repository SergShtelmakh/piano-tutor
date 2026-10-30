# Plan — Real notation: key signatures and spelling

> Roadmap phase: Phase 14 — Real notation: key signatures and spelling
> Branch: `feature/real-notation`
> Status: Implemented (manual validation open)

## Goal

Scores look like the printed music: a key signature at the start of every system, notes spelled as written (D♭, not C♯), signs only where the key doesn't cover them, and enough space between the staves for the notes written between them.

## Approach

- **Model (`src/core/smf.ts`)**: `Piece` gains `keySignatures: readonly KeySignature[]` (`{ tick, fifths }`, sorted, always starting at tick 0, default C). `PieceNote` gains an optional `spelling?: { step: 0..6; alter: -1 | 0 | 1 }` (C = 0 … B = 6). MIDI notes leave it unset.
- **Readers**: `smf.ts` reads `FF 59` (`sf` as a signed byte, −7 … 7). `musicxml.ts` reads `<key><fifths>` (first per tick, like time signatures, shifted by the pickup padding) and the spelling of each note from `<step>` / `<alter>`; with `<transpose>`, the step moves by `<diatonic>` + 7 × `<octave-change>`. Alter ±2 (or a step/alter that doesn't match the pitch) is respelled by FR-3.
- **New pure module `src/core/spelling.ts`**: `spell(note, fifths, given?) → { step, octave, alter }` (the given spelling when it matches the pitch, else flats for fifths < 0 and sharps otherwise); `keyAlterations(fifths)` (step → alter); `keySignatureIndexes(fifths, clef)` (staff indexes of the signs: treble sharps F5 C5 G5 D5 A4 E5 B4, flats B4 E5 A4 D5 G4 C5 F4; bass = treble − 14); `staffIndex(step, octave)` = (octave − 4) × 7 + step.
- **`staff.ts`**: `spellNote` takes the spelled note (step, octave, alter) as well as the clef, so the position comes from the spelling; the sharp-only path stays for callers that pass none (built-in lesson generators use white keys).
- **`score.ts`**: each `ScoreBar` gets `keySignature: number` and `showKeySignature` (first bar, and where the key changes). Notes are placed by their spelling. The accidental rule becomes: the state of each staff position starts from the key's alterations at the start of every bar; a note draws a sign when its alter differs from the state (`sharp` / `flat` / `natural`), then updates it; tied continuations draw nothing. `ScoreNote.accidental` gains `'flat'`.
- **Staff space**: `staffGap(score)` in `score.ts` (pure): the lowest index on the treble staff and the highest on the bass staff over the whole piece (ledger lines included) give the needed room; result ≥ 4 staff spaces. `ScoreView` and `StaffView` place the bass staff below the treble by that gap instead of using one shared index axis.
- **`scoreLayout.ts`**: a system's start width becomes clef + key signature (+ time signature on the first bar or at a change); a bar where the key changes reserves the width of its signature. `KEY_SIGN_WIDTH` per sign.
- **`course.ts`**: `notationOf` keeps the bars' key; `drillNotation(steps, fifths)` takes the key at the start of the piece and spells its notes by it.
- **Drawing**: `notationPaths.ts` gains `FLAT_PATH` (Bravura U+E260, same extraction as the sharp and natural). `ScoreView` draws key signatures (system start and changes) and flats, and uses the per-piece gap. `StaffView` draws the same signs through the same helpers (a key of C draws none) and uses the same gap rule.

## Task groups

1. **Key signatures and spelling in the readers**
   - [x] `KeySignature`, `Piece.keySignatures`, `PieceNote.spelling` in `smf.ts`; `FF 59` in the MIDI reader (signed byte; default C).
   - [x] `musicxml.ts`: `<key><fifths>`, per-note spelling, transposed spelling, pickup shift of key changes.
   - [x] `src/core/spelling.ts` with `spell`, `keyAlterations`, `staffIndex` and FR-3 respelling.
   - [x] Tests: MIDI with and without `FF 59` (negative `sf`), MusicXML keys (default, change, two parts), spelled notes (D♭ stays D♭, E♯, C♭, alter ±2 respelled, mismatched step), transposed parts, `spell` for every black key in sharp and flat keys.
2. **Score model**
   - [x] `spellNote` with a spelled note; `ScoreBar.keySignature` / `showKeySignature`; placement by spelling.
   - [x] Accidental rule against the key (FR-5) with `flat`.
   - [x] `staffGap(score)` (FR-7).
   - [x] `course.ts`: bars keep the key; `drillNotation(steps, fifths)`.
   - [x] Tests: signs in D♭ major (none for in-key notes, a natural for a G natural, sign holds for the bar, resets next bar), sharp keys, C major unchanged for existing scores, tied notes, gap minimum and growth, drills in a flat key. Existing score and course tests stay green; the all-library course test still passes.
3. **Layout and glyphs**
   - [x] `keySignatureIndexes(fifths, clef)` in `spelling.ts` with tests (all 15 keys, both clefs).
   - [x] `scoreLayout.ts`: key signature width at every system start and at key changes; tests that notes start after the signature.
   - [x] `FLAT_PATH` in `notationPaths.ts` (Bravura U+E260), credit line updated.
4. **Drawing in `ScoreView`**
   - [x] Key signatures at system starts and changes, flats before notes, the per-piece staff gap (two staff origins instead of one axis); cursor, sounding notes, and seeking still line up.
   - [x] Check with `Pitces Of Memory.mxl`, a library piece in a flat key, and a sharp key at 360 px and on a wide screen.
5. **`StaffView` on the shared code, and the gates**
   - [x] `StaffView` uses `spellNote`, the key-signature helper (C by default), and `staffGap`.
   - [x] Run every gate; update the debt note in `tech-stack.md` during replan.

## Files touched

| File                                                                 | Change                                                  |
| -------------------------------------------------------------------- | ------------------------------------------------------- |
| `src/core/smf.ts`, `smf.test.ts`, `smfTestHelpers.ts`                | `KeySignature`, `keySignatures`, `spelling`; `FF 59`    |
| `src/core/musicxml.ts`, `musicxml.test.ts`, `musicxmlTestHelpers.ts` | `<key>`, per-note spelling, transposed spelling         |
| `src/core/spelling.ts`, `spelling.test.ts`                           | New: spelling, key alterations, key-signature positions |
| `src/core/staff.ts`, `staff.test.ts`                                 | Placement from a spelled note                           |
| `src/core/score.ts`, `score.test.ts`                                 | Key per bar, accidentals against the key, `staffGap`    |
| `src/core/scoreLayout.ts`, `scoreLayout.test.ts`                     | Key-signature widths                                    |
| `src/core/course.ts`, `course.test.ts`                               | Key in bars and drills                                  |
| `src/components/notationPaths.ts`                                    | `FLAT_PATH`                                             |
| `src/components/ScoreView.tsx`                                       | Key signatures, flats, staff gap                        |
| `src/components/StaffView.tsx`                                       | Shared spelling / signature / gap                       |

## New dependencies

None. The flat outline is taken from the Bravura font (SIL OFL 1.1) the same way as the existing glyphs; the font itself is not added to the project.

## Risks & open questions

- **The flat outline** must be extracted from Bravura like the sharp and natural (the earlier glyphs were converted by hand from the font). If the font is fetched for that, it stays outside the repository; only the path string is committed.
- **Wider staff gap** makes every system taller, so fewer systems fit on a phone screen. The view still shows two systems; check that the follow-scroll and the cursor still feel right at 360 px.
- **MIDI spelling by key sign** is right for most pieces but not for chromatic passages (an F♯ in F major is spelled G♭). A harmonic speller is out of scope.
- **Library course ids** must not change: the course builder reads pitches, not spellings; the all-library course test guards it.
