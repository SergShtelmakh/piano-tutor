# Plan — Real notation: beams

> Roadmap phase: Phase 15 — Real notation: beams
> Branch: `feature/beams`
> Status: Implemented (manual validation open)

## Goal

Eighth and sixteenth notes in the score view are joined by beams within a beat, with a gentle slope and second beams for sixteenths, instead of each note having its own flag.

## Approach

- **New pure module `src/core/beams.ts`** (no React / DOM):
  - `beatUnits(timeSignature)`: the beat in sixteenths (FR-2): 4 for x/4, 8 for x/2, 6 for 6/8 · 9/8 · 12/8 and 3/8, 4 for other x/8 and x/16, 16 for x/1.
  - `beamGroups(bar, clef)`: walks the columns of one staff of one bar and returns groups `{ columns: number[] (indexes into bar.columns[clef]), direction: 'up' | 'down', secondary: { from, to }[], hooks: { column, side: 'left' | 'right' }[] }`. A group is a run of non-rest eighth / sixteenth columns inside one beat (`Math.floor((unit − bar.startUnit) / beat)` equal), at least two long. The direction uses the existing `stemDirection` over all notes of the group. Secondary beams join neighbouring sixteenths; a lone sixteenth gets a hook towards its neighbour (right for the first column, left otherwise).
  - `beamLine(stems, direction)`: each stem is given by its x and two staff indexes, the note nearest the beam (the highest for stems up, the lowest for stems down) and the note it starts from. It returns the beam height (in staff steps) at the first and last stem: the line through the nearest notes of the first and last stem, moved by the minimum stem length, with its slope limited to two staff steps (one space) in total, then moved away from the notes until every stem is at least the minimum length. `heightAt(line, x)` interpolates between the ends.
- **`score.ts`**: no model change; `stemDirection` is reused. A helper `beamsOf(bar)` (in `beams.ts`) gives the groups of both staves so the view and the tie drawing agree on directions.
- **`ScoreView.tsx`**:
  - `BarView` asks `beamGroups` for both staves; `NoteColumn` gets an optional `beam` (the group's direction and the beam height at this column) and then draws its stem to the beam, skips the flag, and does not cut the stem at the staff edge.
  - A new `Beams` element per group draws the primary beam (a filled parallelogram, about half a staff space thick), secondary beams and hooks (offset by beam thickness + gap towards the notes).
  - `Ties` uses the same direction map, so a tie on a beamed note sits opposite the group's stems.
- Dots, accidentals, ledger lines, the cursor, and the blue notes are unchanged (they don't depend on the stem).

## Task groups

1. **Grouping (pure)**
   - [x] `beatUnits` and `beamGroups` in `src/core/beams.ts` (groups, direction, secondary beams, hooks).
   - [x] Tests: 4/4 eighths in pairs, sixteenths in fours; 3/4; 6/8 and 12/8 in threes; 3/8 as one group; 2/2; 5/8; a rest breaks a group; a quarter breaks a group; a single eighth stays alone; a dotted eighth + sixteenth (hook left on the sixteenth); sixteenth + dotted eighth (hook right); eighth + two sixteenths (secondary beam on the two); tied eighths still beamed; groups never cross a bar; direction of a group by its average.
2. **Beam geometry (pure)**
   - [x] `beamLine` and `heightAt`: slope from first to last note, limit one staff space, flat for equal ends, minimum stem length for every stem (inner notes higher / lower than the ends), both directions.
   - [x] Tests for each case, including a chord column (the stem starts from the far note).
3. **Drawing in `ScoreView`**
   - [x] Stems of beamed columns end on the beam, no flags; primary and secondary beams and hooks; ties follow the group's direction.
   - [x] Render `Pitces Of Memory.mxl`, a library piece with sixteenths (e.g. Bach Invention 2 or the Fantaisie-Impromptu), and one in 6/8 at a wide width and at 330 px with headless Chrome, and compare with printed music.
4. **Gates**
   - [x] Run every gate; the all-library course test passes.

## Files touched

| File                                 | Change                                                      |
| ------------------------------------ | ----------------------------------------------------------- |
| `src/core/beams.ts`, `beams.test.ts` | New: beats, groups, secondary beams, hooks, beam geometry   |
| `src/components/ScoreView.tsx`       | Beams, stems to the beam, no flags in groups, tie direction |

## New dependencies

None.

## Risks & open questions

- **Dense passages at 330 px**: beams over narrow columns may look cramped; the layout is unchanged, so check that a beam never runs into the next group's first notehead.
- **Chords in a group**: the stem starts from the note farthest from the beam; the minimum stem length is measured from the note nearest to it. Covered by geometry tests; check a chordal left hand visually.
- **The reduction** (one voice per staff, rounding to sixteenths) still merges voices, so some groups will differ from the printed edition until Phase 16.
