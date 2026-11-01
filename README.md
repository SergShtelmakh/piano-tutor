**English** · [Українська](README.uk.md) · [Deutsch](README.de.md) · [Français](README.fr.md)

# Piano Tutor

A gamified piano-learning web app: connect a MIDI keyboard (Web MIDI) and get real-time feedback on whether you play the right notes. Client-side only, no backend. See [specs/mission.md](specs/mission.md).

> Status: Phases 1–21 are done. Free play with a MIDI keyboard, the computer keyboard, or the on-screen piano; a 13-lesson first-week curriculum; local progress (stars, XP, levels, daily streak); an installable offline app (PWA); a responsive on-screen piano; a Player for MIDI and MusicXML files with sheet music; a library of 34 public-domain classical pieces; and **courses** that teach the opening of a library piece, hand by hand; a recorded piano sound; a dark design with separate Home, My lessons, Library, Free play, and Settings screens; **My lessons**, one list of the pieces you are learning, from the library or from your own files kept on the device; **lesson controls**: tempo, Listen, a metronome, one hand at a time, pause, and a hint on the piano; and a **lesson layout editor** (piano height, octaves, rows of music, note names), kept for portrait and landscape. The app is deployed online (see Deployment). Next steps — see [specs/roadmap.md](specs/roadmap.md).

> **Keeping the translations in sync:** this file is the source. `README.uk.md`, `README.de.md`, and `README.fr.md` are translations of it; update them whenever this file changes.

## Prerequisites

- [Bun](https://bun.sh) (npm also works)
- A Chromium-based browser (Chrome, Edge) for Web MIDI. Other browsers can still play with the on-screen piano and computer keyboard.

## Getting started

```bash
bun install
bun run dev      # http://localhost:3000
```

## How to play

- **Screens:** **Home** shows a **Continue** card that picks up where you left off, your level and streak, and tiles for **My lessons**, **Library**, **Free play**, and **Settings**. On a phone every screen has a back button; on a tablet a rail on the left, and on a wide screen a sidebar, switch between them. A lesson fills the whole window: back, title, a progress bar, the lesson controls, pause, and a mute button at the top, the piano at the bottom.
- **MIDI keyboard:** open **Settings**, click **Connect MIDI keyboard**, and allow access. Every connected keyboard works, including the sustain pedal. Web MIDI needs Chrome or Edge and a secure page (HTTPS or `localhost`). The connection stays while you move between screens.
- **Computer keyboard:** `A S D F G H J K L ;` are the white keys (C D E F G A B C D E) and `W E T Y U O P` are the black keys. The left `Shift` key (`⇧`) plays the B just below the first C. `Z` / `X` shift the octave down / up. Keys are matched by physical position, so this works on QWERTZ and AZERTY layouts too.
- **On-screen piano:** click or touch the keys. The piano is as wide as the screen (minus the navigation on a tablet or computer) and shows more octaves when they fit (keys stay at least 40 px wide, up to all 88 keys on a wide monitor). On a narrow phone it keeps finger-sized keys and scrolls sideways: swipe the octave ruler above the keys (swiping the keys plays them). In **Free play**, the octave buttons and `Z` / `X` move the range the computer keyboard plays (B2–C5 by default: the B below the first C, two octaves, and the top C), and the view follows.
- **Keyboard size:** the **Keyboard** button in **Settings → MIDI keyboard** (shown when Web MIDI is available) tells the app how many keys your real keyboard has: pick 25, 37, 49, 61, 76, or 88 keys and move the range by octaves if it starts on another note, or press **Calibrate**, play the lowest and then the highest key of your MIDI keyboard, and save the result (any size works). The setting is saved on your device. Keys of the on-screen piano outside it are dimmed (they still play), and a lesson with notes your keyboard doesn't have shows a notice with how many; the lesson stays playable. Nothing is set until you choose a size.
- **Home and lessons:** the app opens on **Home**; **Continue** picks up what you played last: the next built-in lesson you haven't finished, or the next unfinished lesson of the piece you were learning. Under **Basics**, the **My lessons** screen has 13 lessons in five units: right hand (treble clef), left hand (bass clef), both clefs, melodies (Mary Had a Little Lamb, Ode to Joy, Twinkle Twinkle), and intervals and chords. Press **Start** on a lesson card; the lesson marked **Next** is the first one you haven't finished, but nothing is locked. The staff shows a row of notes: the highlighted one is the one to play, played ones turn grey. For a chord, play all its notes in any order. A wrong key counts as a mistake and the target stays until you play it right. At the end you get your accuracy, 1–3 stars, and XP. Random lessons give a new order on every start.
- **My lessons:** the pieces you are learning, in one list: the last played first. Each row shows where the piece came from (the library or a file), a progress bar, and the share of its course lessons you have finished (**New** before the first). **All** / **From file** / **From library** filter the list. **Add lesson** offers **From file** (a MIDI or MusicXML file; a copy is kept on your device, so it opens later and offline without choosing it again) and **From library** (opens the Library, where **+** adds a piece). Press a row to open its course. The bin removes a piece after you confirm; your stars stay, and a kept file is deleted from the device. Pieces you had already started before this list existed are added once.
- **Lesson controls:** every lesson has **Listen** (the app plays the rest of the page, in the piece's rhythm in a course lesson; the keys light up, and nothing it plays counts as yours), the **tempo** (− / +, 40–200 bpm, 80 by default), **Metronome**, and **Hint** (a ring on the key or keys to play now). The tempo paces Listen, the metronome, and the other hand; your playing is still judged by the notes, not the timing. A both-hands course lesson also has **Left / Both / Right**: with one hand you play only its notes, and the app plays the other hand after each step. Such a run is practice: it shows your accuracy, but saves no stars or XP. **Pause** (also Space, or switching to another tab) stops all sound and offers **Resume**, **Restart**, and **Back**. Tempo, metronome, and hint are saved on your device and apply to every lesson.
- **Lesson layout:** **Settings → Lesson layout → Edit layout** opens an editor that shows a lesson with an example held still, with the controls on top of it. Choose the **keyboard** height (S–XL, or drag the handle above the piano), the **octaves** on screen (Auto, as before, or 1–4 around the lesson's notes), the **rows** of music a course lesson shows at once (1–3) and their **height** (S–XL), whether every white key shows its **name** (off by default: only the C keys and the keys that are lit), and the **hint**. Each orientation of the screen has its own layout: the editor edits the one you hold the device in, so rotate it to set the other, and lessons switch when you rotate. The top bar shows the window size. Changes are saved at once; the reset button restores this orientation's defaults. Free play and the Library keep their usual piano.
- **Player:** the **Library** screen is also the player: **Open file** opens a MIDI file (`.mid`, formats 0 and 1, up to 2 MB) with a file chooser. The file is read on your device and never uploaded. It is shown as sheet music (key signatures, sharps and flats, note values, rests, bars, ties; beams within a beat; two voices on a staff when a MusicXML file has them, otherwise a simplified one-voice version; no tuplets; the space between the staves grows for notes written between them) in lines, and plays with a moving cursor while the keys that sound light up teal. **Play** / **Pause** / **Stop**, a tempo slider (50–150 %), and a position slider (or a click on the score) let you move around. Percussion is skipped.
- **MuseScore / MusicXML:** the Player also opens a score exported from MuseScore (**File → Export → MusicXML**) as compressed `.mxl` or plain `.musicxml` / `.xml` (up to 2 MB); the format is detected from the content. All parts are merged, percussion is skipped, and the piece plays at 120 bpm once through, as written (tempo marks, repeats, and grace notes are ignored; the tempo slider still works). In a part with two staves, the upper staff is the right hand and the lower one the left hand, so a **Learn** button next to the file name builds a course (as for a library piece) in which every note is in the hand it was written for. **Learn** also works for your own `.mid` file (hands split at middle C there). Press **Add to My lessons** to keep the file on your device: its course is then listed under **My lessons** and opens later, also offline. Stars and XP are saved either way; a file you don't add is not kept.
- **Library:** the **Library** screen shows 34 classical piano pieces by 10 composers (Bach, Beethoven, Brahms, Burgmüller, Chopin, Handel, Haydn, Mozart, Schubert, Schumann), grouped by composer, with a portrait of each, and rated from 1 (Beginner) to 5 (Expert). Search by title or composer, filter by difficulty or favourites, pick a piece, and press **Play**. **+** adds a piece to **My lessons**. Mark pieces as favourite (★) or done (☑); the marks stay on your device. A piece you have opened once also opens offline. The files are mechanical renderings of the score, so they sound exact but not expressive. The **Library** button hides or shows the list.
- **Learn a piece:** press **Learn** next to any library piece (or in its info line above the score). The app builds a **course** from the opening of the piece (its first 6 parts, each up to 4 bars) and orders the lessons from the simplest to the hardest. For the **right hand**, then the **left hand**: read the notes the piece uses, then its chords (if there are any), then the parts one by one, then the parts joined (1–2, 3–4, 5–6, 1–4, 1–6). Then **both hands together**: the parts, then the joined parts. Every lesson shows the real notation of the piece with the current step marked teal; you play what you see, and the app judges the notes (not the timing). Nothing is locked, a **Next** badge marks the first lesson you have not finished, and **+** next to the piece adds it to **My lessons**, where its progress is shown. Both hands at once can need several fingers or keys together, so the on-screen piano or a MIDI keyboard helps there.
- **Sound:** every key plays a recorded piano (an upright, two loudness layers, so soft and hard keys sound different). Notes fade by themselves like on a real piano and stop when you let go, unless the sustain pedal is down. **Volume**, **Mute**, and **Reverb** (a light room sound, on by default) are in **Settings → Sound**, and lessons, Free play, and the Library have a mute button; all three are saved on your device. The sound loads when the app opens: until then keys are silent and "Loading piano sound…" is shown; if loading fails, press **Retry**.
- **Progress:** XP raises your level, and finishing at least one lesson per day builds a daily streak. Everything is saved on your device only; **Reset progress** at the bottom of the **My lessons** screen clears it (the list of your pieces stays).

## Library

The pieces are MIDI files from the [Mutopia Project](https://www.mutopiaproject.org/), kept in `public/library/<composer>/`. **Only pieces whose own Mutopia page says "Public Domain"** (its "Copyright" field) are used. The Mutopia Project also publishes pieces under CC-BY and CC-BY-SA, which need credit or share-alike; those are left out, and `src/core/library.test.ts` fails if a piece has any other licence. The composers' portraits are public-domain paintings, drawings, and photographs from [Wikimedia Commons](https://commons.wikimedia.org/) (the Commons page must say "Public domain"; a test allows nothing else). The source, licence, and check date of every piece and every portrait are in [licenses/library-sources.md](licenses/library-sources.md) and in the catalogue (`src/core/libraryCatalog.ts`). This is a record, not legal advice. Note that Mutopia's own "Public Domain" filter also lists CC pieces, so always read the piece's page.

To add a piece:

1. Open the piece's page on mutopiaproject.org and check that it says **Copyright: Public Domain**. Take the single `.mid` file (not a zip).
2. Save it as `public/library/<composer>/<slug>.mid`, with a lower-case slug of letters, digits, and hyphens.
3. Add an entry to `LIBRARY_PIECES` in `src/core/libraryCatalog.ts`: the Mutopia id, the usual title with its opus or catalogue number, the duration in seconds, and a difficulty from 1 to 5 (see the rubric in [specs/phase-10-midi-library/requirements.md](specs/phase-10-midi-library/requirements.md), FR-4). A new composer also needs an entry in `LIBRARY_COMPOSERS` (with a public-domain portrait from Wikimedia Commons, saved as a square JPEG of at most 40 KB in `public/library/portraits/`) and a `composer…` name in all four locales.
4. Add a line to `licenses/library-sources.md`.
5. Run `bun run test`: it checks the licence, the file, its duration, and its size.

## Install and offline

Piano Tutor is an installable web app (PWA). Open it once online; after that it works without a connection: lessons, free play, sound, progress, MIDI input, and the files you added to My lessons.

- **Install:** in Chrome (Android or desktop) Home shows an **Install** card, or use the browser menu / the install icon in the address bar. **Not now** hides the card for good.
- **Updates:** when a new version has been deployed, a banner offers **Reload** or **Later**. The app never reloads by itself, and the banner waits until you leave a lesson. Progress and settings are kept.
- **Size:** the first visit downloads about 12 MB of piano samples with the app, so the piano also sounds offline.
- **Dev:** `bun run dev` has no service worker. To try offline mode, use `bun run build && bun run preview`.
- **Icon:** drawn as `public/icon.svg`. After changing it, run `bun run icons` to regenerate the PNG and ICO files, and commit them.

## Scripts

| Script                           | What it does                                                                                                                       |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `bun run dev`                    | Dev server on http://localhost:3000                                                                                                |
| `bun run build`                  | Type check + production build into `dist/`                                                                                         |
| `bun run preview`                | Serve the production build locally                                                                                                 |
| `bun run lint`                   | TypeScript type check, then ESLint                                                                                                 |
| `bun run format`                 | Format all files with Prettier                                                                                                     |
| `bun run format:check`           | Fail if any file is not formatted                                                                                                  |
| `bun run test`                   | Run unit tests once (Vitest)                                                                                                       |
| `bun run icons`                  | Regenerate app icons from `public/icon.svg`                                                                                        |
| `bun run piano-samples <folder>` | Rebuild `public/piano/` from the extracted FreePats set (needs ffmpeg; see [licenses/piano-samples.md](licenses/piano-samples.md)) |

CI (GitHub Actions) runs `lint`, `format:check`, `build`, and `test` on every pull request and every push to `main`.

## Deployment

The app is a static site, deployed to two hosts so they can be compared (see [specs/phase-03-deployment-device-testing/](specs/phase-03-deployment-device-testing/)). Web MIDI needs HTTPS, which both provide.

| Host                 | URL                                                                                                                                           | How it deploys                                                                                              |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| GitHub Pages         | https://sergshtelmakh.github.io/piano-tutor/                                                                                                  | The `deploy-github-pages` job in `.github/workflows/ci.yml` runs after CI passes on `main`. No PR previews. |
| Cloudflare (Workers) | https://piano-tutor.sh-serg1993.workers.dev/ (branch preview: https://feature-deployment-device-testing-piano-tutor.sh-serg1993.workers.dev/) | Git integration: pushes to `main` update production; every other branch and PR gets a preview URL.          |

The footer of the app shows the commit and host of the running build.

**GitHub Pages setup (once):** repository Settings → Pages → Source: **GitHub Actions**. The build uses `BASE_PATH=/piano-tutor/`.

**Cloudflare setup (once):** Workers & Pages → Create → Pages → Connect to Git → this repository, then:

- Production branch: `main`
- Build command: `bun install --frozen-lockfile && bun run build` (fallback if Bun fails: `npm install && npm run build`)
- Build output directory: `dist`
- Preview command (the branch Previews that Cloudflare creates for every non-production branch): `npx wrangler preview`. A Preview is its own resource, so `npx wrangler versions upload` fails there with "The name in your wrangler.jsonc file must match the name of your Worker". `wrangler preview` is an open beta command and once failed with API error 10013 on the asset upload; a retry fixed it. Check the command on the Preview page of each new branch if it was copied from somewhere else.
- `wrangler.jsonc` in the repo sets the Worker name (`piano-tutor`), the `dist` assets directory and the `previews` block that branch preview builds (`wrangler preview`) require.
- Environment variable `BUN_VERSION`: `1.4.4`
- Leave Web Analytics off (privacy by default).

Cloudflare sets `CF_PAGES*` (Pages) or `WORKERS_CI*` (Workers Builds, which is what the dashboard created: a `workers.dev` URL), which the build reads for the footer. The base path stays `/`.

## Credits

The treble and bass clef shapes, and the sharps, naturals, flags, and rests of the MIDI player's score, are outlines from the [Bravura](https://github.com/steinbergmedia/bravura) music font, © Steinberg Media Technologies GmbH, used under the SIL Open Font License 1.1 (see [licenses/Bravura-OFL-1.1.txt](licenses/Bravura-OFL-1.1.txt)).

The app font is [Manrope](https://github.com/sharanda/manrope), © The Manrope Project Authors, used under the SIL Open Font License 1.1 (see [licenses/Manrope-OFL-1.1.txt](licenses/Manrope-OFL-1.1.txt)). It is served from the app itself.

The library pieces are from the [Mutopia Project](https://www.mutopiaproject.org/), public domain editions, and the composers' portraits are public-domain images from [Wikimedia Commons](https://commons.wikimedia.org/) (see [licenses/library-sources.md](licenses/library-sources.md)).

The piano sound is made from the [Upright Piano KW](https://freepats.zenvoid.org/Piano/acoustic-grand-piano.html) sample set of the FreePats project, recorded by Gonzalo and Roberto from a Kawai upright piano and published under the [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) public domain dedication (see [licenses/piano-samples.md](licenses/piano-samples.md)). The app is not made, sponsored, or endorsed by Kawai.

## Language

The UI is available in English, Ukrainian, German, and French. The first visit follows the browser language (falling back to English); the language you pick in **Settings** is remembered.

## Development process

This project uses Spec-Driven Development. Specs in [specs/](specs/) are the source of truth — start with [specs/README.md](specs/README.md).
