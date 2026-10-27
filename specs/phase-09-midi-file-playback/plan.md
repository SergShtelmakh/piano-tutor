# Plan — MIDI file playback

> Roadmap phase: Phase 9 — MIDI file playback
> Branch: `feature/midi-file-playback`
> Status: Implemented (manual validation open)

## Goal

The learner opens a `.mid` file, sees it as sheet music on the grand staff, presses Play, and watches a cursor move along the staff while the piece sounds and the matching piano keys light up blue.

## Approach

This is the largest phase so far. It is cut into five task groups; the two heaviest are the notation builder (group 2) and the score view (group 4). If either grows past one review, split off a "notation polish" phase (beams, key signatures, flats) rather than leaving the phase half done.

**Core (pure, `src/core/`, new modules, all unit-tested)**

- `smf.ts` — the Standard MIDI File parser.
  - `parseMidiFile(bytes: Uint8Array): ParseResult`, where `ParseResult` is `{ ok: true, piece }` or `{ ok: false, error: 'notMidi' | 'unsupported' | 'empty' | 'tooLarge' | 'damaged' }` (FR-3, FR-4). It never throws.
  - Reads the `MThd` header (format 0 / 1, ticks per quarter; rejects format 2 and SMPTE), then each `MTrk`: variable-length delta times, running status, channel messages (note on / off, controller 64), meta events (tempo `0x51`, time signature `0x58`, end of track), and skips SysEx and unknown metas by length. Channel 10 (index 9) is dropped. Note on with velocity 0 is note off. Notes are paired per (channel, note); a retriggered note closes the previous one; unclosed notes end at the last tick.
  - `Piece`: `{ ticksPerQuarter, notes: { note, startTick, endTick, start, end, velocity }[], pedal: { time, tick, on }[], tempos: { tick, time, microsPerQuarter }[], timeSignatures: { tick, numerator, denominator }[], duration }`. Times are in seconds at 100 %. A tempo map function `tickToSeconds` does the conversion once, while building the piece.
  - Limits: `MAX_FILE_BYTES = 2 * 1024 * 1024`, `MAX_NOTES = 50_000`, `MAX_DURATION_SECONDS = 4 * 3600` (so a score has a bounded number of bars). All reads are bounds-checked, and a track length that runs past the file is `damaged`.
- `staff.ts` — add `spellNote(note)`: `{ position: StaffPosition, sharp: boolean }`, where a black key is the white key below it plus a sharp. `staffPosition` (lessons) stays unchanged.
- `score.ts` — the notation reduction (FR-5, FR-6).
  - Quantise note starts and ends to a sixteenth-note grid (`ticksPerQuarter / 4`), minimum length one grid unit.
  - Bars from the time signatures (a `numerator/denominator` bar has `16 · numerator / denominator` grid units; a piece with no time signature is 4/4). A piece may begin with an anacrusis: it is just a shorter first bar of whole bars, so it isn't detected, and the first bar is full-length.
  - Per staff (treble / bass by `spellNote`'s clef): group notes by quantised start into **columns**; a column lasts until the next column's start (or the bar end), capped at the longest of its notes; gaps are **rests**.
  - Split every column and rest at bar lines and into standard values (whole 16, dotted half 12, half 8, dotted quarter 6, quarter 4, dotted eighth 3, eighth 2, sixteenth 1) with a greedy largest-first rule; extra pieces become **ties**.
  - Accidentals per bar (FR-5): track the sharp / natural state of each staff position in the bar.
  - Chord geometry reuses Phase 6's rule for seconds (the upper note of a second moves right).
  - Output: `Score { bars: ScoreBar[], totalBars }`, where a bar has its number, time signature (and whether to show it), start / end time in seconds, and for each staff a list of `Column`s (`{ unit, units, time, value, dots, rest, notes: { note, index, sharp, natural, shifted, tieNext, tiePrev, ledger }[] }`). Playback ignores all this.
- `scoreLayout.ts` — systems and the cursor map (FR-7, FR-8, FR-12).
  - `layoutSystems(score, width)` wraps bars greedily into systems. Column width is proportional to its length with a floor that keeps noteheads apart (and room for an accidental or a shifted second); each system reserves room for the clefs and the time signature. A bar wider than the width gets its own system, scaled down to a floor; below it, the box scrolls.
  - `cursorAnchors(system)`: sorted `(time, x)` pairs for every column and bar line, so `xAtTime(layout, t)` is piecewise-linear and `timeAtX(system, x)` (for clicks) snaps to the nearest column.
  - `visibleSystems(layout, time)`: the indices of the current and next system.
- `playback.ts` — the schedule.
  - `buildSchedule(piece)`: all `noteon` / `noteoff` / `sustain` events with their times, sorted (at equal times: `noteoff` before `noteon`, so repeated notes retrigger).
  - `drain(schedule, fromIndex, toTime)`: returns the events due and the new index. `indexAtTime(schedule, time)` (binary search) for seeks. Both are pure.
  - (Planned `soundingAt` was not needed: the player already knows which notes it holds, and the score uses that set together with the column times.)
- `types.ts` — `NoteSource` gains `'playback'`.
- `keyboardLayout.ts` — `shownRange(width, baseOctave, include?)`: when `include` (the piece's lowest and highest note, clamped to A0–C8) is given, the range starts as the union of the base range and `include`; the existing octave-adding rule then still applies. If that union is wider than `width / 40` white keys, the piano keeps 40 px keys and scrolls (existing behaviour). Tested for the new parameter.

**Player adapter (`src/playback/`)**

- `usePlayer.ts`: owns the loaded piece, the schedule, and the clock. State: `position` (seconds at 100 %), `playing`, `rate`. A timer (`setInterval` ~ 10 ms plus `requestAnimationFrame` for the cursor) reads `performance.now()`, advances `position` by `elapsed × rate`, calls `drain` and emits the events on the bus with `source: 'playback'` (no accumulating drift, because position comes from the clock, not from summed intervals). It keeps the set of notes it holds, and `releaseAll()` emits `noteoff` for them and `sustain: false` when the pedal is down; this runs on pause, stop, seek, a new file, the end of the piece, and unmount. Seeking uses `indexAtTime`. The cursor position is exposed through a ref / `useSyncExternalStore`, so the per-frame update doesn't re-render the whole screen.
- `loadMidiFile.ts`: reads a `File` with `arrayBuffer()`, checks the size before parsing (`tooLarge`), and returns the `ParseResult`.

**UI (`src/components/`)**

- `ModeSwitch`: `Mode` gains `'player'`; the label key is `modePlayer`.
- `PlayerScreen.tsx`: the Open button (a visually hidden `<input type="file" accept=".mid,.midi,audio/midi">` behind a button), the file name, an error message region (`role="alert"`), the controls (Play / Pause toggle, Stop, tempo slider with its percent, position slider with `m:ss` elapsed / total), and `ScoreView`. The piano is the existing `PianoKeyboard`, rendered by `App` as in free play.
- `ScoreView.tsx`: SVG for the two visible systems. It draws, per system: the five-line staves for both clefs (clef outlines from `clefPaths.ts`), the brace line and bar lines, the time signature (SVG text digits), and per column the noteheads (ellipses, as `StaffView` does: open for half and whole, filled otherwise), accidentals, stems, flags, dots, rests, ledger lines, and ties. Notes sounding at the cursor are blue. The cursor is a line positioned from `xAtTime`. A click handler converts the click to `timeAtX` and calls `seek`. The new glyph outlines (sharp, natural, flags, rests) come from Bravura in `notationPaths.ts`, as the clefs did (SIL OFL 1.1, already credited). If the font can't be obtained, they are drawn by hand and the plan notes it.
- `PianoKeyboard`: new optional props `include` (the piece's range, passed to `shownRange`) and `followHeld` behaviour: the follow-scroll guard now checks only keys held by a pointer (`pressed`), not `lit.size`, so playing notes can steer the view. `focusNotes` is the set of notes sounding now. The lesson screen is unchanged (its focus notes and guard behave as before, because lesson notes are not held while it scrolls).
- `App`: renders `PlayerScreen` and the piano for the `'player'` mode; the free-play-only octave control stays free-play-only. The player hook lives in `PlayerScreen`, so leaving the mode unmounts it and releases the notes (FR-15). The loaded piece and position live above it (in `App` state) so a language change, which doesn't unmount, keeps them; leaving the mode stops playback but keeps the file until another is opened or the page reloads.

**Translations**: `modePlayer`, `playerOpen`, `playerHint`, `playerPlay`, `playerPause`, `playerStop`, `playerTempo`, `playerPosition`, `playerError{NotMidi,Unsupported,Empty,TooLarge,Damaged}`, `playerScoreLabel` (with `{name}` and a plural `{count}` bars), in `en` first, then `uk`, `de`, `fr`.

## Task groups

1. **MIDI file parser and playback schedule (core)**
   - [x] `src/core/smf.ts`: header, tracks, running status, meta events, tempo map, notes paired per channel, pedal, limits, no throws
   - [x] `src/core/playback.ts`: `buildSchedule`, `drain`, `indexAtTime`; `NoteSource` gets `'playback'`
   - [x] Unit tests (MIDI bytes built in a small test helper): format 0 and 1, running status, velocity-0 note off, tempo changes (seconds), time signatures, channel 10 dropped, unclosed notes, retriggered notes, pedal, every error case (`notMidi`, `unsupported`, `empty`, `tooLarge`, `damaged`: truncated header and track), schedule ordering at equal times, `drain` / `indexAtTime` at the edges
2. **Notation reduction and system layout (core)**
   - [x] `spellNote` in `staff.ts`; `src/core/score.ts`: quantising, bars, columns, rests, splitting into standard values with ties, accidentals per bar, seconds
   - [x] `src/core/scoreLayout.ts`: system wrapping, column widths, cursor anchors, `xAtTime`, `timeAtX`, `visibleSystems`
   - [x] `shownRange(width, baseOctave, include?)` in `keyboardLayout.ts`
   - [x] Unit tests: a bar of quarters, a dotted rhythm, a note across a bar line (tied), a 5-sixteenth note (quarter + sixteenth tied), a gap (rest), a chord with a second, sharps and a following natural in one bar, 3/4 and 6/8 bars, a time-signature change, notes on both staves, wrapping at several widths, an over-wide bar, the cursor map (monotonic; a click snaps to the nearest column), `shownRange` with `include`
3. **Playback driver**
   - [x] `src/playback/loadMidiFile.ts` and `usePlayer.ts`: clock, play / pause / stop / seek / rate, `releaseAll`, emitting on the bus, exposing the position for the cursor (FR-10 – FR-13)
   - [ ] Check by hand with the dev server and the console before the UI exists: events arrive in time, no stuck notes after pause, stop, seek, and the end
4. **Score view**
   - [x] Bravura outlines for the sharp, natural, flags, and rests in `notationPaths.ts` (licence note in `licenses/` already covers Bravura)
   - [x] `ScoreView.tsx`: two systems, clefs, bar lines, time signature, noteheads, stems, flags, dots, rests, ties, accidentals, blue sounding notes, the cursor, click to seek, and the accessible label (FR-5 – FR-9)
   - [ ] Check readability at 360 px and at 1280 px with a dense and a sparse piece
5. **Player screen, piano, and wrap-up**
   - [x] `ModeSwitch` and `App`: the Player mode; `PlayerScreen` with the Open button, error messages, controls, and sliders (FR-1, FR-2, FR-4, FR-10 – FR-12, FR-15)
   - [x] `PianoKeyboard`: `include` range, follow-scroll from sounding notes, guard on pointer-held keys only (FR-14)
   - [x] All new keys in `en`, `uk`, `de`, `fr` (FR-16); `README.md`: a "Play a MIDI file" bullet and the supported-notation note
   - [ ] Run `validation.md`: automated gates, then manual checks with real files on desktop and an Android phone; ask the user to skim the new `uk` / `de` / `fr` strings

## Files touched

| File                                                                         | Change                                                                        |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `src/core/smf.ts`, `smf.test.ts` (new)                                       | Standard MIDI File parser                                                     |
| `src/core/playback.ts`, `playback.test.ts` (new)                             | Event schedule, drain, seek index, sounding notes                             |
| `src/core/score.ts`, `score.test.ts` (new)                                   | Notation reduction                                                            |
| `src/core/scoreLayout.ts`, `scoreLayout.test.ts` (new)                       | Systems, cursor map                                                           |
| `src/core/staff.ts`, `staff.test.ts`                                         | `spellNote`                                                                   |
| `src/core/types.ts`                                                          | `NoteSource` + `'playback'`                                                   |
| `src/core/keyboardLayout.ts`, `keyboardLayout.test.ts`                       | `include` parameter                                                           |
| `src/playback/loadMidiFile.ts`, `usePlayer.ts` (new)                         | File reading and the playback driver                                          |
| `src/components/PlayerScreen.tsx`, `ScoreView.tsx`, `notationPaths.ts` (new) | Player UI, score drawing, glyph outlines                                      |
| `src/components/ModeSwitch.tsx`, `PianoKeyboard.tsx`, `src/App.tsx`          | Third mode; range and follow for playback                                     |
| `src/i18n/locales/{en,uk,de,fr}.ts`                                          | New strings                                                                   |
| `README.md`, `licenses/`                                                     | Feature description; Bravura credit if the notice needs the new glyphs listed |

## New dependencies

None. The MIDI parser is written in-house (`tech-stack.md`, rule 6), and the glyph outlines are static data, like the clefs.

## Risks & open questions

- **Notation quality is the main risk.** Real files overlap notes, have triplets, and mix voices. The one-voice reduction (FR-6) will look wrong in places, so the spec promises a readable approximation, not a transcription. Check with three or four real files early in group 2 and 4; if a typical piano piece is unreadable, adjust the reduction before polishing the drawing.
- **Hidden tabs:** browsers throttle timers in background tabs, so playback can stutter there. The clock-based position means it doesn't drift, but individual notes may be late. If this matters in practice, a Web Audio look-ahead is a follow-up (the bus has no timestamps, so it needs its own change).
- **Bravura outlines:** getting the glyph paths needs the font file (SIL OFL, from the Bravura repository). If it isn't reachable, draw the few shapes by hand and record that in the plan.
- **Dense bars on a phone:** sixteen sixteenths in one bar need about 260 units. At 360 px the bar may need the scale floor or sideways scrolling. Tune the floor on a phone.
- **Piano range vs. 40 px keys:** a piece spanning five octaves shows scrolled keys on a phone. The follow-scroll could feel jumpy on fast runs. If so, smooth it (move the view only when a sounding note leaves the middle third).
- **Stuck notes** are the worst failure. Every exit path calls `releaseAll`, and a unit-testable invariant (the held set equals the notes with a pending `noteoff`) backs it. Verify pause, stop, seek, end, mode switch, and loading a new file.
- **Playback and live notes share a source map:** `heldNotes` tracks holders per source, so a played key and the same playback note don't cancel each other. A test covers a playback `noteoff` while a key is held by the learner.
