# Plan — MusicXML import

> Roadmap phase: Phase 13 — MusicXML import
> Branch: `feature/musicxml-import`
> Status: Implemented (manual validation open)

## Goal

The learner exports a score from MuseScore as `.mxl` (or `.musicxml`), opens it in the Player, sees and hears it like a MIDI file, and presses **Learn** to get a course in which every note is in the hand it was written for. A course can also be built from the learner's own `.mid`.

## Approach

MusicXML becomes the existing `Piece` (from `smf.ts`), so the player, `buildScore`, the score view, and the course builder are reused. Three small pure readers do the work, and one adapter wires them to a `File`:

- `src/core/xml.ts`: a minimal, non-validating XML reader → a tree of `{ name, attributes, children, text }`. It handles the declaration, comments, `DOCTYPE` (skipped), CDATA, the five named entities and numeric character references, and self-closing tags. No namespaces (MusicXML uses none). Returns `null` on malformed input; never throws.
- `src/core/zip.ts`: reads the end-of-central-directory record and the central directory of a zip and returns its entries (`name`, `method`, `compressed` bytes, sizes, encrypted flag). Decompression is not done here, so the module stays synchronous and pure. Plus `findScoreEntry(entries, containerXml)` for FR-2.
- `src/core/musicxml.ts`: `parseMusicXml(text): ParseResult` (same result type as `parseMidiFile`). It walks `score-partwise` → `part` → `measure` with a time cursor per part (`<duration>`, `<chord/>`, `<backup>`, `<forward>`, ties, grace / cue skipped), converts `divisions` to one `ticksPerQuarter` (the LCM of the file's values, falling back to 960 with rounding when it grows past 3840), reads `<time>`, `<pedal>`, and `<staves>`, pads a pickup bar (FR-7), sets the tempo to 120 bpm, and computes the seconds with the existing `tickToSeconds`. Each `PieceNote` gets an optional `hand` (FR-9). Limits and error kinds as in `smf.ts`.
- `src/core/smf.ts` / `score.ts` / `staff.ts`: `PieceNote` gains `hand?: 'right' | 'left'`. `staff.ts` gains `positionOnClef(note, clef)` (index and ledger lines for a chosen staff); `buildScore` picks the staff from `hand` when it is set and from the middle-C split otherwise (FR-10). The course builder already reads hands from the staves, so FR-11 follows.
- `src/playback/loadScoreFile.ts` (replaces `loadMidiFile.ts`): checks the file size, sniffs the format (FR-1), inflates the `.mxl` entry with `DecompressionStream('deflate-raw')` (stops at 20 MB), decodes UTF-8 (or UTF-16 with a BOM), and calls the right parser. It also returns a content hash (FNV-1a 32-bit, hex) for FR-13. `PlayerProvider.openFile` uses it; `LoadedPiece` gains `fileId` for pieces from disk.
- Courses from a file: `CourseProvider.openCourse` takes a **course source**, either `{ kind: 'library', piece }` (today's path) or `{ kind: 'file', id: 'file-<hash>', title, score }` (built synchronously from the open piece). `CourseScreen` shows the composer, portrait, and difficulty only for library sources; its **Open in Player** reopens a library piece, or just switches to the Player for a file source when that file is still open. `piecesInProgress` already filters by `LIBRARY_PIECES`, so file courses stay off Home (FR-13).

Detection order in the adapter: `MThd` → MIDI; `PK\x03\x04` → zip (MXL); otherwise decode as text and parse as XML; anything else → `notMidi` (the kind keeps its name; its message is reworded).

## Task groups

1. **XML and zip readers (pure)**
   - [x] `src/core/xml.ts` with `parseXml(text)`; tests: nesting, attributes with both quote styles, entities and `&#…;`, CDATA, comments, `DOCTYPE`, self-closing tags, malformed input returns `null`.
   - [x] `src/core/zip.ts` with `readZip(bytes)` and `findScoreEntry`; tests build zips in code (a small helper writes stored and deflated entries, the latter through `CompressionStream('deflate-raw')` in Node), plus a truncated zip, an encrypted flag, an unknown method, and both container cases of FR-2.
2. **MusicXML → Piece (pure)**
   - [x] `PieceNote.hand?` in `smf.ts` (MIDI notes leave it unset).
   - [x] `src/core/musicxml.ts` with `parseMusicXml`; `src/core/musicxmlTestHelpers.ts` builds small scores in code.
   - [x] Tests: pitch with `alter`; durations across a `divisions` change; chords; `backup` / `forward` with two voices and two staves; ties; rests; grace and cue notes skipped; percussion part and `<unpitched>` ignored; several parts merged; time signature changes and the 4/4 default; pickup padding; pedal start / stop / change; hands from staves and none for one-staff parts; 120 bpm seconds; each error kind and the limits.
3. **Hand-aware score (pure)**
   - [x] `positionOnClef(note, clef)` in `staff.ts` (white and black keys, ledger lines across middle C) with tests.
   - [x] `buildScore` places notes by `hand` when set; tests: a right-hand B3 sits on the treble staff with a ledger line, a left-hand D4 on the bass staff; MIDI pieces give the same score as before (existing tests stay green).
   - [x] A course test: a two-staff MusicXML score whose melody crosses middle C keeps it in the right hand.
4. **Opening files in the Player (adapter + UI)**
   - [x] `src/playback/loadScoreFile.ts` (size check, detection, inflate with the 20 MB stop, text decoding, content hash); remove `loadMidiFile.ts`. A test with Node's `DecompressionStream` opens an `.mxl` built in code end to end.
   - [x] `PlayerProvider` uses it; `LoadedPiece.fileId`. The chooser's `accept` lists the five extensions plus `application/vnd.recordare.musicxml`, `application/vnd.recordare.musicxml+xml`, and `application/xml`.
   - [x] Strings: `playerOpen` → "Open file", the hint names MusicXML, `playerErrorNotMidi` names both formats (`en` first, then `uk`, `de`, `fr`).
5. **Learn from an opened file**
   - [x] Course source type in `src/course/context.ts`; `CourseProvider` and `loadCourse` handle both kinds (file sources need no fetch; cached by id).
   - [x] **Learn** button in `PlayerScreen` next to the file name; `CourseScreen` without library details for file sources; **Open in Player** per FR-12; `LibraryPanel` / `PieceInfo` pass library sources.
   - [x] Unit test: `piecesInProgress` ignores `melody:file-…` lessons; `pieceIdOfLesson` reads `file-<hash>`.
   - [x] New strings, if any, in all four locales. Run every gate.

## Files touched

| File                                                                                       | Change                                                   |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| `src/core/xml.ts`, `xml.test.ts`                                                           | New: minimal XML reader                                  |
| `src/core/zip.ts`, `zip.test.ts`, `zipTestHelpers.ts`                                      | New: zip directory reader, score entry lookup, test zips |
| `src/core/musicxml.ts`, `musicxml.test.ts`, `musicxmlTestHelpers.ts`                       | New: MusicXML → `Piece`                                  |
| `src/core/smf.ts`                                                                          | `PieceNote.hand?`                                        |
| `src/core/staff.ts`, `staff.test.ts`                                                       | `positionOnClef`                                         |
| `src/core/score.ts`, `score.test.ts`                                                       | Staff from `hand`                                        |
| `src/core/course.test.ts`                                                                  | Hand from the staff; file ids                            |
| `src/playback/loadScoreFile.ts` (+ test), `loadMidiFile.ts`                                | New adapter; old one removed                             |
| `src/playback/context.ts`, `PlayerProvider.tsx`                                            | `fileId`; new loader                                     |
| `src/course/context.ts`, `CourseProvider.tsx`, `loadCourse.ts`                             | Course sources (library / file)                          |
| `src/components/PlayerScreen.tsx`, `CourseScreen.tsx`, `PieceInfo.tsx`, `LibraryPanel.tsx` | Accepted types, Learn button, file course header         |
| `src/i18n/locales/{en,uk,de,fr}.ts`                                                        | Reworded Player strings                                  |

`README.md` (and its three translations), `roadmap.md`, `tech-stack.md`, and the changelog are updated in the Replan step.

## New dependencies

None. The XML reader is in-house (rule 6; `DOMParser` is a DOM API and is missing in the `node` test environment, and libraries such as `fast-xml-parser` are not needed for the subset MusicXML uses). Decompression uses the platform's `DecompressionStream` (Chrome 103+, Node 18+), so no zip library (`fflate`, `jszip`) is needed.

## Risks & open questions

- Real MuseScore exports may contain things the in-code test scores miss (MuseScore 3 vs 4, other notation programs). The user is asked to open a few real exports during validation; problems found there become fixes or backlog notes.
- A tie whose stop note is in another voice, or cross-staff notes (a note written on staff 1 but shown on staff 2 via `<staff>`), follow `<staff>` of the note itself; unusual cases may sound or look slightly off.
- The fixed 120 bpm makes slow pieces play fast until the learner moves the tempo slider. Tempo marks are in the backlog.
- UTF-16 files without a BOM are rare and are reported as `damaged`.
