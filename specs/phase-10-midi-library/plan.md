# Plan — MIDI library

> Roadmap phase: Phase 10 — MIDI library
> Branch: `feature/midi-library`
> Status: Validated

## Goal

The Player comes with a library of about 30 public-domain classical piano pieces, grouped by composer and rated for difficulty. The learner picks a piece, sees it as sheet music, and presses Play. They can mark favourites and pieces they have finished.

## Approach

**Catalogue and rules (pure, `src/core/`)**

- `libraryCatalog.ts` (data): `LIBRARY_COMPOSERS` (`{ id, nameKey, born, died }`, with `nameKey` a translation key such as `composerBach`) and `LIBRARY_PIECES`. A piece is `{ id, composer, title, difficulty: 1..5, duration (s), file ('bach/bwv-515-aria.mid', relative to public/library), source: { url, licence: 'Public Domain', checkedOn: 'YYYY-MM-DD' } }`. The type of `licence` is the literal `'Public Domain'`, so another licence does not compile; the test also checks it at run time.
- `library.ts` (logic): `DIFFICULTY_LEVELS` (the five names as translation keys), `ALLOWED_LICENCES`, `pieceUrl(base, piece)`, and `browse(pieces, composers, { difficulty, favouritesOnly }, marks, nameOf, locale)`, which filters, then groups by composer (sorted with `Intl.Collator(locale)`) and orders pieces by difficulty, then title. It returns `{ composer, pieces }[]` and drops empty sections.
- `libraryMarks.ts` (logic): `LibraryMarks { favourites: string[]; done: string[] }`, `toggleFavourite(marks, id)`, `toggleDone(marks, id)`, `parseMarks(text)` (invalid data means empty marks; unknown ids are kept so a removed piece does not wipe the rest), and `serialiseMarks(marks)` (`{ version: 1, ... }`).

**Content (the research-heavy part)**

- Pick about 30 pieces from the Mutopia Project, 8 or more composers, a spread over difficulty levels 1–5 (FR-4). The pool found while writing this spec (not final; every piece must still be checked on its own page):
  - Bach: Polonaise in F (BWV 117a), the chorales BWV 269, 347, 454, 462, and the Aria BWV 515.
  - Beethoven: Piano Sonata Op. 2 No. 1 (movements 1, 3, 4) and Op. 10 (several movements).
  - Mozart: Sonata KV 309 (first movement), the Theme and Variations of KV 331, the fugues KV 153 and 154.
  - Chopin: the Op. 10 études (several are Public Domain), Trois Nouvelles Études No. 1.
  - Schumann: Kinderszenen Nos. 1, 5, and 7 (Träumerei), Widmung, Romanze Op. 28 No. 2.
  - To add: easy pieces for levels 1–2 and more composers (for example Handel, Scarlatti, Burgmüller, Grieg's lyric pieces, Haydn, Schubert, Diabelli, Clementi's other works). Satie (all CC-BY-SA on the first page) and zip-only pieces are skipped.
- Per piece: open the piece's Mutopia page and confirm "Public Domain"; download the single `.mid` with `curl` into `public/library/<composer>/<slug>.mid`; check the size; run it through the real pipeline (parse → `buildScore` → `layoutSystems`) to see that it works and the notation is readable; rate the difficulty; write the catalogue entry (the duration from the parsed file). Prefer pieces with one clear melody over dense polyphony, because the Phase 9 notation shows one voice per staff.
- Record the source of every file in the catalogue, and list them in `licenses/library-sources.md` (composer, title, Mutopia URL, licence, date checked).

**Loading and offline**

- `src/library/loadLibraryPiece.ts`: `fetch(pieceUrl)` → `arrayBuffer()` → `parseMidiFile`. A network error or a non-OK status returns `{ ok: false, error: 'network' }`. The base path comes from `import.meta.env.BASE_URL`, so GitHub Pages (`/piano-tutor/`) and Cloudflare (`/`) both work. File names have no spaces or capitals beyond the slug, to avoid case and encoding problems on the hosts.
- `PlayerProvider`: `openFile(file)` and a new `openLibraryPiece(piece)` share one internal `show(piece, name, library?)`; `LoadedPiece` gets an optional `library` field (the catalogue entry). The error state becomes `ParseError | 'network'`. Both calls keep the "latest request wins" guard.
- `vite.config.ts`: Workbox `runtimeCaching` with `urlPattern: /\/library\/.*\.mid$/`, `handler: 'CacheFirst'`, `cacheName: 'piano-tutor-library'`, `expiration: { maxEntries: 60 }`, and `cacheableResponse: { statuses: [200] }`. `globPatterns` stays as it is, so `.mid` is not precached.

**Marks**

- `src/library/storage.ts` (`localStorage` key `piano-tutor.library`, try/catch), `context.ts` (`useLibraryMarks()`), and `LibraryMarksProvider.tsx` (state from `parseMarks`, saves on each change, memory fallback when storage is blocked). It sits inside `PlayerProvider` in `App`.

**UI (`src/components/`)**

- `PlayerScreen`: the **Library** button (a toggle; `aria-expanded`, `aria-controls`), `LibraryPanel` below the buttons, and `PieceInfo` above the score for a library piece (not for a file from disk). Choosing a piece calls `openLibraryPiece`, closes the panel, and does not start playback.
- `LibraryPanel.tsx`: the filter (`DifficultyFilter` with the five levels and "All", plus Favourites), then a section per composer (heading button with `aria-expanded`), then rows. A row is two controls: a main button (title, difficulty, duration, ✓/★ state) that loads the piece, and the ★ and ✓ toggles. The footer holds the Mutopia credit.
- `DifficultyDots.tsx`: filled and empty dots plus the level name, as text and `aria-label`.
- `PieceInfo.tsx`: title, composer, difficulty, the source line, and the two toggles.

**Translations**: `playerLibrary`, `libraryTitle`, filter labels, `libraryAll`, `libraryFavourites`, `libraryNoMatch`, five `difficulty1`–`difficulty5` names, `libraryMarkFavourite`, `libraryMarkDone`, `librarySource`, `libraryLoading`, `playerErrorNetwork`, `libraryCredit`, and a `composer…` key per composer (`nameKey`), in `en` first, then `uk`, `de`, `fr`.

## Task groups

1. **Catalogue rules and tests (pure)**
   - [x] `src/core/libraryCatalog.ts` (types and the first few entries so the tests have data), `src/core/library.ts` (`browse`, `pieceUrl`, difficulty names, allowlist), `src/core/libraryMarks.ts`
   - [x] Unit tests: `browse` (filter by level, favourites only, grouping, name ordering in two locales, empty sections dropped, piece ordering); the marks (toggle on and off, parse of invalid and unknown data, round trip); catalogue integrity against the files on disk (files exist, parse, duration within 2 s, at most 150 KB each and 3 MB in all, every `.mid` listed, unique ids, difficulty 1–5, licence and source host, check date, composers have pieces, level coverage from FR-4)
2. **Choose, verify, and add the pieces**
   - [x] Pick about 30 pieces; open each Mutopia page and confirm "Public Domain"; download the `.mid` files into `public/library/`
   - [x] Run every file through the pipeline; drop pieces whose notation is unreadable; rate the difficulty with the FR-4 rubric; write the catalogue entries and `licenses/library-sources.md`
   - [x] Make the coverage test pass (24–40 pieces, 8 or more composers, levels 1–5 covered)
3. **Marks, loading, and offline**
   - [x] `libraryMarks` storage and provider (`src/library/`), wired into `App`
   - [x] `loadLibraryPiece.ts` and `PlayerProvider.openLibraryPiece`; the `network` error
   - [x] Workbox runtime caching for `/library/*.mid`; check with `bun run build && bun run preview` that an opened piece loads offline and an unopened one shows the message (FR-11, FR-12)
4. **Library UI in the Player**
   - [x] `LibraryPanel`, `DifficultyDots`, `PieceInfo`; the Library button in `PlayerScreen` (FR-5 – FR-10)
   - [x] Check at 360 px and 1280 px, with the keyboard only (Tab, Enter, Space)
5. **Translations, credits, validation**
   - [x] All new keys in `en`, `uk`, `de`, `fr`, including the composer names (FR-14)
   - [x] `README.md`: the library, the licence policy, the Mutopia credit, and "how to add a piece" (FR-13)
   - [x] Run `validation.md`: automated gates, then manual checks on desktop and an Android phone; ask the user to skim the new `uk` / `de` / `fr` strings and to confirm the licence policy

## Files touched

| File                                                                                            | Change                                                       |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `src/core/libraryCatalog.ts`, `library.ts`, `libraryMarks.ts` and their tests (new)             | Catalogue, browsing rules, marks rules                       |
| `public/library/<composer>/*.mid` (new, about 30 files)                                         | The MIDI files                                               |
| `licenses/library-sources.md` (new)                                                             | Source, licence, and check date of every piece               |
| `src/library/storage.ts`, `context.ts`, `LibraryMarksProvider.tsx`, `loadLibraryPiece.ts` (new) | Marks persistence and loading                                |
| `src/playback/PlayerProvider.tsx`, `context.ts`                                                 | `openLibraryPiece`, the `library` field, the `network` error |
| `src/components/PlayerScreen.tsx`                                                               | Library button, panel, info line                             |
| `src/components/LibraryPanel.tsx`, `DifficultyDots.tsx`, `PieceInfo.tsx` (new)                  | Library UI                                                   |
| `src/App.tsx`                                                                                   | `LibraryMarksProvider`                                       |
| `vite.config.ts`                                                                                | Runtime caching for library files                            |
| `src/i18n/locales/{en,uk,de,fr}.ts`                                                             | New strings and composer names                               |
| `README.md`                                                                                     | Library, credits, licence policy                             |

## New dependencies

None. Files are fetched with `fetch`, and caching uses the Workbox already in the build (Phase 7).

## Risks & open questions

- **The licence is the whole point.** Mutopia's own listing filter was wrong, so a piece is only accepted after its own page says "Public Domain", and the policy is also a test. "Public Domain" is the contributor's declaration on Mutopia; this spec and the app make no legal guarantee. The user should confirm the policy is enough for how the app will be used.
- **Not enough easy pieces.** Mutopia's Public Domain pool is strong in Beethoven, Mozart, Chopin, and Bach's chorales, but thin in beginner pieces. If levels 1–2 can't reach 4 pieces each, lower the coverage numbers in FR-4 and the test (spec first) rather than adding pieces with another licence.
- **The notation of real pieces.** The Phase 9 score is one voice per staff, with no beams or tuplets. Fugues and dense sonata movements will look cluttered. Choose pieces whose score reads well (check each one), and note any weak ones in the catalogue.
- **Mechanical sound.** The files are generated from the score: exact but with no dynamics. It is a limitation of the source, not a bug.
- **Long pieces.** A sonata movement can be 5 minutes and about 100 KB. The 150 KB and 8-minute limits are the guard. The score and layout of such a file take well under a second (Phase 9 measurements).
- **Hosting paths.** File names are lowercase slugs without spaces, because GitHub Pages is case-sensitive and the base path differs per host. Check a library piece on both hosts after the deploy.
- **Repository size.** About 1–2 MB of binary files in git is acceptable; the 3 MB cap keeps it so.
- **Cache growth.** The runtime cache stores only pieces the learner opened (at most 60 entries). A changed file would stay cached under the same URL, so a replaced piece gets a new file name.

## Notes from the implementation

- The first implementation had 35 pieces by 11 composers. After the amendment below the library has **34 pieces by 10 composers** (levels: 5 / 6 / 12 / 8 / 3), all verified on their own Mutopia page (the page calls the licence field "Copyright"). All files together are about 330 KB.
- The checks that read the disk live in `config/libraryFiles.test.ts` (that project has the Node types); the rules about the data are in `src/core/library.test.ts`.
- A host that answers a missing file with its HTML fallback page (the dev server does) is treated as a `network` error, not as a damaged file.
- Pieces with an apparently default tempo of 60 bpm (for example the Rondo alla Turca, which sounds half as fast as it should) and pieces over 8 minutes (the Appassionata finale) were left out.
- The Satie and Clementi pieces turned out not to be usable (CC-BY-SA, and zip-only), as the research had suggested.

## Amendment: no Russian composers, and portraits

Requested by the user after the first implementation (see the Amendment in `requirements.md`). Both changes stay inside this phase, so they are one more commit on the same branch.

- **Remove Tchaikovsky:** his three pieces, his composer entry, the folder `public/library/tchaikovsky/`, his lines in `licenses/library-sources.md`, his name in the four locales, and the mentions in the README and this plan. The coverage rules of FR-4 must still hold, so add easy pieces (level 1 needs at least 4): check each on its own Mutopia page, as before.
- **Portraits (FR-15):**
  - Source: Wikimedia Commons files whose licence field says "Public domain"; read the data from the Commons API (licence, author, year, file page), crop each image to a square around the face, scale it to 200 × 200 px, and save it as a JPEG of at most 40 KB in `public/library/portraits/<composer>.jpg`. Cropping and scaling use a one-off script (not added to the repository, no dependency).
  - Catalogue: `LibraryComposer` gets `portrait: { file, source: { url, author, year, licence, checkedOn } }`. `library.ts` gets `PORTRAIT_LICENCES = ['Public domain', 'CC0']` and `COMMONS_HOST`; `library.test.ts` and `config/libraryFiles.test.ts` check the rules of FR-15.
  - UI: a `Portrait` component (a round image with the initials as a fallback on error), used in `LibraryPanel` (40 px) and `PieceInfo` (72 px). A string for the portrait credit in the panel footer, in the four locales.
  - Offline: add `jpg` to the Workbox `globPatterns`, so the portraits are precached.
  - Docs: `licenses/library-sources.md` gets a table of the portraits; the README credits Wikimedia Commons.
- [x] Remove Tchaikovsky and keep the coverage rules (added Burgmüller "Progrès" and a Handel menuet, both verified on their own Mutopia page)
- [x] Portraits: source, crop, and record them; catalogue fields, tests, the `Portrait` component, offline precache, credits (ten Commons images, 5–8 KB each)
- [x] Run the gates (lint, format, build, test) and update the docs
