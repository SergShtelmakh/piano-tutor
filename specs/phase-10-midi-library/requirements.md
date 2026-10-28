# Requirements — MIDI library

## Context

Roadmap Phase 10. Phase 9 added the Player: open a `.mid` file and watch and hear it. The learner needs files to open, and has to find their own. This phase ships a **library of classical piano pieces** inside the app, grouped by composer, each with a **difficulty level**, so the Player has something to play from the first minute.

The hard part is **licensing**. The user's requirement: free files, not burdened by licences. What the research for this spec found:

- **A composition is not a file.** A classical work by a composer who died long ago is in the public domain, but a MIDI _file_ is a separate work by whoever sequenced it, with its own licence. Most MIDI collections carry restrictive or unclear terms.
- **piano-midi.de** (the well-known classical collection) is, according to third-party sources (the Debian copyright file for `midicsv`, Wikimedia Commons), under CC BY-SA 3.0 Germany. That means attribution plus share-alike. That is a licence burden, so it is **not** used. (The site's own licence page could not be opened during research; this was not confirmed at the source.)
- **The Mutopia Project** publishes typeset scores of classical music, with a MIDI file for each piece, and states a **licence per piece**: Public Domain, CC-BY, or CC-BY-SA. Public Domain carries no conditions at all. The MIDI files are generated from the engraved score, so their rhythm is exact (which suits the Phase 9 notation) and they sound mechanical, with no expressive playing.
- **Mutopia's licence filter is unreliable.** A listing filtered to "Public Domain" still showed CC-BY and CC-BY-SA pieces. So **every piece must be checked on its own Mutopia page**, and the policy is enforced by a test.
- Some composers have no usable pieces: for example all of the first page of Satie is CC-BY-SA, and Clementi's Sonatina is only offered as a zip archive.
- Patents don't apply to music files. (Nothing in this phase is legal advice: the app records the source, licence, and check date of every piece so it can be audited, and the user should confirm the policy is acceptable for their purposes.)

What exists: the Player (`PlayerScreen`, `PlayerProvider`, `parseMidiFile`) opens a `File` chosen by the learner. The library adds a second way in: a piece fetched from the app's own static files. The service worker (Phase 7) precaches only code and images, so library files need their own caching to work offline. Progress and settings use `localStorage` with a versioned key and try/catch.

**Amendment (after the first implementation, requested by the user):** (1) **No composers of Russian origin** in the library. Tchaikovsky was the only one, so his three pieces were removed, and easy pieces by other composers were added so that FR-4 still holds. (2) **Portraits of the composers.** They follow the same idea as the pieces: only images that are in the public domain, taken from Wikimedia Commons, with the source and licence recorded.

Terms used below:

- **Catalogue:** the list of pieces in code (`src/core/libraryCatalog.ts`), the single source of truth. Every `.mid` file under `public/library/` is listed in it, and every entry has its file.
- **Difficulty level:** a whole number from 1 to 5, rated by hand against the rubric in FR-4.
- **Marks:** the learner's own **favourite** (★) and **done** (✓) flags on a piece.

The clarifying questions and their answers are in the **Decisions** table. Rows marked _(agent default)_ were not asked; please review them.

## Functional requirements

**Content and licence**

- **FR-1** The library has about **30 pieces** (at least 24 and at most 40) by at least **8 composers**. Each piece is a classical work for piano (or playable on piano), with one `.mid` file taken from the Mutopia Project. **Composers of Russian origin are not included.**
- **FR-2** **Only pieces whose own Mutopia page says "Public Domain" are included.** CC-BY and CC-BY-SA pieces, files from other sites, zip-only pieces, and files we write ourselves are out. For every piece the catalogue records: the Mutopia page URL, the licence (`Public Domain`), and the date it was checked. A unit test fails if a piece has any other licence, a source outside `mutopiaproject.org`, or no check date.
- **FR-3** Each catalogue entry has: a stable `id`, the composer, a **title** (the work's usual name, with opus or catalogue number where it has one, and the movement; for example "Träumerei (Kinderszenen, Op. 15 No. 7)"), a **difficulty** (1–5), the **duration** in whole seconds, the file path, and the source data of FR-2. The unit tests check, against the real files on disk: every entry's file exists, parses with the Phase 9 parser, has a duration within 2 s of the catalogue value, and is at most 150 KB; every `.mid` under `public/library/` is in the catalogue; ids are unique; every composer has at least one piece; and the whole library is at most 3 MB.
- **FR-4** **Difficulty** is one of five levels with a name, rated by the agent from the rubric below (the user may change a rating by editing one number):

  | Level | Name         | What it looks like                                                                                                                         |
  | ----- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
  | 1     | Beginner     | Slow, mostly stepwise, a range of about an octave and a half, one hand at a time or very simple chords, no or few sharps, under 1½ minutes |
  | 2     | Easy         | Both hands with simple rhythms, a range of two octaves, a few sharps, steady eighth notes, up to about 2 minutes                           |
  | 3     | Intermediate | Both hands with different rhythms, sixteenth notes, moderate leaps, several accidentals, up to about 4 minutes                             |
  | 4     | Advanced     | Fast passages, wide leaps, dense chords or inner voices, many accidentals, or several minutes of sustained playing                         |
  | 5     | Expert       | Very fast runs, large stretches, and heavy independence of the hands (such as the Chopin études)                                           |

  Every level from 1 to 5 has at least 2 pieces, and levels 1–3 have at least 4 pieces each, so a beginner finds something to play.

**Browsing**

- **FR-5** The Player screen has a **Library** button next to **Open MIDI file**. It opens and closes a library panel under the buttons (a toggle button with `aria-expanded`). The panel works with a mouse, touch, and the keyboard (Tab and Enter).
- **FR-6** The panel lists the **composers**, ordered alphabetically by their name in the UI language. Each composer is a section with a heading (name and years, such as "Johann Sebastian Bach · 1685–1750"), and each section can be collapsed and expanded. All sections start expanded. Inside a section, pieces are ordered by difficulty, then title. Each piece row shows the **title**, the **difficulty** (dots **and** the level name as text), the **duration** as `m:ss`, a ✓ if it is marked done, and a ★ if it is a favourite.
- **FR-7** Above the list is a **difficulty filter**: buttons "All" and 1 to 5 (one is selected at a time, `aria-pressed`), and a **Favourites** toggle. The list shows only matching pieces; composers with no match are hidden; a translated "No pieces match" message shows when nothing matches. The filter is not saved.
- **FR-8** Choosing a piece **loads it into the Player** the same way as an opened file: playback stops, the score and controls show the piece, and the panel closes. It **does not start playing by itself**; the learner presses Play. While the file loads (a moment), the row shows a "Loading…" state and the other rows stay usable.
- **FR-9** A library piece shows an **info line** above the score: the title, the composer, the difficulty (dots and name), and **Source: Mutopia Project · Public Domain**, where "Mutopia Project" links to the piece's Mutopia page (opens in a new tab, with `rel="noopener noreferrer"`). A file opened from the learner's own disk shows only its file name, as in Phase 9.

**Marks**

- **FR-10** Every library piece has two toggles, **Favourite** (★) and **Done** (✓), in the piece list rows and in the info line (buttons with `aria-pressed` and a text label, not colour only). Marks are saved on the device in `localStorage` under `piano-tutor.library` as versioned JSON; invalid data means no marks; blocked storage keeps the marks for the session. Nothing else about the library is saved. A mark change takes effect at once everywhere (list and info line).

**Loading and offline**

- **FR-11** Library files are fetched **on demand** from the app's own static files (under the app's base path, so both hosts work). A failed load (offline and not cached, or a missing file) shows a translated message under the buttons and keeps the previous piece.
- **FR-12** The `.mid` files are **not precached** by the service worker (the install stays small). A piece the learner has opened once is **cached** by the service worker the first time it loads, so it opens again **offline**. A piece never opened before shows the failed-load message when offline. At most 60 library files are kept in the cache.

**Credits and translations**

- **FR-13** The panel ends with a note: "Pieces from the Mutopia Project, public domain editions." with a link to mutopiaproject.org, and a second line crediting the portraits to Wikimedia Commons (FR-15). `README.md` credits the Mutopia Project and explains the licence policy and how to add a piece.
- **FR-14** All new strings exist in `en`, `uk`, `de`, `fr`: the Library button, the panel strings, the filter labels, the five difficulty names, the marks labels, the source line, the loading and error messages, and the **composer names** (in each language's usual form, for example "Johann Sebastian Bach", "Йоганн Себастьян Бах", "Johann Sebastian Bach", "Jean-Sébastien Bach"). **Piece titles are not translated.**
- **FR-15** Every composer has a **portrait**: a small square JPEG (at most 40 KB) of a painting, drawing, or photograph that Wikimedia Commons marks as **Public domain** (or CC0).
  - It shows as a round **40 px** thumbnail at the left of the composer's heading in the library panel, and as a **72 px** picture in the info line of an open piece.
  - It is decorative (empty alt text, because the composer's name is already text beside it). If the image does not load, the thumbnail becomes the composer's **initials**.
  - For every portrait the catalogue records: the file, the Commons file page, the author, the year, the licence, and the day it was checked. The tests allow only the licences `Public domain` and `CC0`, a source on `commons.wikimedia.org`, an existing file of at most 40 KB, and a portrait for every composer.
  - The panel footer and the README credit Wikimedia Commons, and `licenses/library-sources.md` lists every portrait.
  - The portrait files are precached (about 100 KB in all), so they show offline.

## Non-functional requirements

- User-facing text goes through the translations module (English is the default; `uk`, `de`, and `fr` get the keys too).
- Works with the on-screen and computer keyboard (no MIDI device required); the whole library is usable with the keyboard alone.
- Pure core: the catalogue, grouping, filtering, ordering by name and difficulty, and the marks rules (toggle, parse, serialise) live in `src/core/` with unit tests. Fetching, `localStorage`, and the UI stay in thin adapters and components.
- The library reuses the Phase 9 pipeline unchanged: a library file goes through `parseMidiFile`, `buildScore`, and the Player like any opened file. No change to the note bus, the synth, or the parser.
- Privacy: no analytics, no third-party requests (files come from our own origin; the Mutopia links are only followed when the learner clicks them).
- Size: the whole library is at most 3 MB in the repository and in the deployed site. Files are loaded one at a time.
- No colour-only signals (difficulty is dots plus text; marks are buttons with labels).
- Layout works at 360 px width: rows wrap, buttons are at least 40 px high, and there is no horizontal page scroll.
- No new runtime dependencies.

## Out of scope

- A search box, sorting options, or tags (the composer grouping and the difficulty filter are the way to browse); both go to the backlog.
- CC-BY and CC-BY-SA pieces, other MIDI sources, files we write ourselves, and pieces for other instruments; downloading zip archives.
- Computed difficulty, learner-set ratings, recommendations, "next piece" suggestions, and a link between the library and lessons, XP, streaks, or stars (the Player doesn't judge playing).
- Composer biographies, piece descriptions, previews before loading, and translating piece titles.
- Deep links or URLs for a piece, sharing, and syncing marks between devices or tabs.
- Letting the learner add their own pieces to the library, or editing the catalogue in the app.
- Playing along with a piece (a later phase), and expressive or recorded performances: the files are mechanical renderings of the score.
- A "Library" mode or Home section (the library lives inside the Player).

## Decisions

| Question                                     | Decision                                                                                                                                        | Reason                                                                                                                     |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Where the files come from                    | The Mutopia Project, **Public Domain pieces only**                                                                                              | User choice. Public Domain carries no conditions; CC-BY needs credit and CC-BY-SA needs share-alike, so both are excluded. |
| How difficulty is decided                    | Five levels, rated by hand in the catalogue                                                                                                     | User choice. A computed score would be crude and could rate a fast, easy piece wrongly.                                    |
| Where the library lives                      | Inside the Player (a Library button next to Open MIDI file)                                                                                     | User choice. One screen for everything to do with playing a file; no extra tab.                                            |
| Size and extra state                         | About 30 pieces, plus favourite and done marks saved on the device                                                                              | User choice.                                                                                                               |
| Licence check _(agent default)_              | Every piece is checked on its own Mutopia page, and a test enforces the allowlist                                                               | The list filter on Mutopia showed non-Public-Domain pieces under "Public Domain".                                          |
| Delivery _(agent default)_                   | Static files in `public/library/`, fetched on demand, cached by the service worker after the first open                                         | No backend; both hosts serve them; a small install; opened pieces work offline.                                            |
| Marks _(agent default)_                      | Two manual toggles per piece (favourite, done); nothing is set automatically                                                                    | The Player doesn't judge playing, so "done" can only mean what the learner says.                                           |
| Order _(agent default)_                      | Composers alphabetically by displayed name; pieces by difficulty, then title                                                                    | Predictable in every language; easy pieces come first.                                                                     |
| After choosing a piece _(agent default)_     | It loads and waits for Play                                                                                                                     | Sound starting by itself is surprising; choosing a piece is not a request to play it.                                      |
| Duration _(agent default)_                   | Stored in the catalogue and verified by a test against the real file                                                                            | The list can show a length without loading every file.                                                                     |
| Titles and names _(agent default)_           | Composer names are translated; piece titles keep the original or usual name                                                                     | Classical titles are international; names are spelled differently per language.                                            |
| Branch base _(agent default)_                | `feature/midi-library` starts from `origin/main`, which already contains Phase 9; keyboard size and calibration moved from Phase 10 to Phase 11 | Phase 9 was merged; the library was asked for next.                                                                        |
| Composers of Russian origin _(user request)_ | None in the library; Tchaikovsky's three pieces were removed and easy pieces by other composers took their place                                | User decision.                                                                                                             |
| Portraits _(user request)_                   | A public-domain portrait per composer from Wikimedia Commons, square, small, shown in the panel and the info line; initials if it fails         | Same licence idea as the pieces: no image with conditions. A picture makes the long list easier to scan.                   |
