# Changelog

All notable changes to this project are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## 2026-10-28 — Phase 11: melody learning

### Added

- A **Learn** button on every library piece opens a **course**: the piece is split into parts of up to 4 bars, and the course teaches the first 6 parts.
- Three stages: **right hand**, **left hand**, **both hands**. Each hand stage starts with reading the notes the piece uses, then its chords, then the parts one by one, then the parts joined together. The both-hands stage has the parts and their joins. Lessons go from the simplest to the hardest, nothing is locked, and **Next** marks where to continue.
- Lessons show the **real sheet music** of the piece, with the current step in blue and a line on it. Stars, XP, and your streak work as in the other lessons.
- A course screen with stars and accuracy for each lesson, and **Open in Player** to hear the piece.
- **Pieces you are learning** on Home, with a **Continue** button.
- The on-screen piano shows the whole range of a lesson, and the computer-key octave is chosen to fit it.
- All new messages are translated into Ukrainian, German, and French.

### Notes

- Lessons check which notes you press, not the rhythm.

## 2026-10-28 — Phase 10: MIDI library

### Added

- A **Library** in the Player: 34 classical piano pieces by 10 composers (Bach, Beethoven, Brahms, Burgmüller, Chopin, Handel, Haydn, Mozart, Schubert, Schumann), grouped by composer, each with a **portrait**. Pick a piece, see it as sheet music, and press Play.
- Every piece has a **difficulty** from 1 (Beginner) to 5 (Expert), shown as dots and as a word. Filter the list by difficulty or by your favourites.
- Mark pieces as **favourite** (★) or **done** (☑). Your marks stay on your device.
- A piece you have opened once also opens **offline**, and the portraits are available offline too.
- The source and licence of each piece are shown above the score, with a link to its page. All pieces are **public domain** (from the Mutopia Project) and all portraits are public-domain images (from Wikimedia Commons).
- Composer names, difficulty names, and all new messages are translated into Ukrainian, German, and French.

### Notes

- The files are generated from the printed score, so the rhythm is exact but the playing is not expressive.

## 2026-10-28 — Phase 9: MIDI file playback

### Added

- A new **Player** mode: open a MIDI file (`.mid`) and see it as sheet music on the grand staff, with sharps, note values, rests, bars, and ties. The file is read on your device and never uploaded.
- **Play, Pause, and Stop**, a tempo slider (50–150 %), and a position slider. Click the score to jump to that place.
- A **moving cursor** follows the music across the staves, and the notes that sound are drawn in blue. The matching piano keys light up blue too, and the on-screen piano shows the range of the piece and scrolls along on a narrow screen.
- Playing keys yourself while a file plays still works.
- Clear messages for files that cannot be shown (not MIDI, unsupported, no notes, too large, damaged), translated into Ukrainian, German, and French.

### Notes

- The score is a simplified reading of the file: one voice per staff, no key signatures, beams, or tuplets. The sound always follows the original file. Drum tracks are skipped.

## 2026-10-28 — Phase 8: responsive on-screen keyboard

### Added

- The on-screen piano now **fits your screen**: it uses the full window width and shows more octaves when they fit, up to all 88 keys on a wide monitor.
- On a narrow phone the keys stay finger-sized and the piano **scrolls sideways**. Swipe the octave ruler above the keys to scroll; touching the keys always plays.
- The piano follows the music: it scrolls when you change octave and to the current note in a lesson.

### Changed

- The octave control is now labelled **Computer keys** (it moves the range the computer keyboard plays).
- The new labels are translated into Ukrainian, German, and French.

## 2026-10-26 — Phase 7: PWA & offline

### Added

- **Install Piano Tutor** as an app on Android and desktop Chrome: an **Install** card on Home (or the browser menu). **Not now** hides the card for good.
- **Works offline:** after one visit online, lessons, free play, sound, progress, and MIDI work without a connection. A short note tells you when the app is ready offline.
- **Updates:** when a new version is out, a banner offers **Reload** or **Later**. The app never reloads by itself and waits until you leave a lesson. Your progress and settings are kept.
- An **app icon** and favicon.
- The new messages are translated into Ukrainian, German, and French.

## 2026-10-26 — Phase 6: lesson content

### Added

- **13 lessons** in five units on Home: right hand (treble clef), left hand (bass clef), both clefs, melodies (Mary Had a Little Lamb, Ode to Joy, Twinkle Twinkle, and Ode to Joy for the left hand), and intervals and chords.
- The staff now shows a **row of notes**: the one to play is highlighted, played ones turn grey, and the next ones are visible so you can read ahead.
- **Chords and intervals** are drawn as stacked notes.
- A **Next** badge marks the first lesson you haven't finished. Nothing is locked.
- Lesson titles, unit headings, and instructions are translated into Ukrainian, German, and French.

### Changed

- To finish a chord, **press all its notes at the same time**. Keys you released don't count, and a wrong key cancels the try, so you press the whole chord again.
- The first lesson is now called "Around middle C". Your earlier results for it are kept.

## 2026-10-25 — Phase 5: game mechanics & local progress

### Added

- A **Home** screen (the new default) with your level, an XP bar, your daily streak and best streak, and a lesson list showing best stars, best accuracy, and number of runs.
- **Stars and XP:** a finished lesson earns 1 star, 2 stars from 80 %, or 3 stars from 95 % accuracy, and 15 / 20 / 25 XP. XP raises your level.
- **Daily streak:** finish at least one lesson per day to keep it going.
- The lesson summary shows your stars, XP, level-ups, streak, and "New best!" notes.
- **Reset progress** on Home, with a confirmation.
- Progress is saved on your device only. If the browser blocks storage, the app still works and says that progress cannot be saved.

### Changed

- The mode switch is now **Home / Free play**; lessons start from Home and **Back** returns there.

## 2026-10-25 — Phase 4: first lesson

### Added

- A **Free play / Lesson** switch at the top. The lesson trains note reading: a note appears on a music staff (treble and bass clef), and you play that key with the MIDI keyboard, the computer keyboard, or the on-screen piano.
- Each lesson has 20 random white-key notes from B3 to C5, never the same note twice in a row, in a new order on every start. A wrong key counts as a mistake and the note stays until you play it right. The played key and the note flash green or red.
- A summary with your accuracy, correct notes, and mistakes (with correct plural forms in Ukrainian, German, and French), **Play again**, and **Back to free play**.
- The left `Shift` key plays the B just below the first C, and the on-screen piano got that extra key (26 keys, B2–C5 by default), so the whole lesson range can be played without changing the octave.

### Changed

- The translations support inserted values and plural forms.

### Credits

- The clef shapes come from the Bravura music font (SIL Open Font License 1.1).

## 2026-10-25 — Phase 3: online on two hosts

### Added

- The app is deployed over HTTPS, so Web MIDI works on any device. GitHub Pages: https://sergshtelmakh.github.io/piano-tutor/ (goes live after this release is merged). Cloudflare: https://piano-tutor.sh-serg1993.workers.dev/, with a preview link for every branch.
- A small footer shows which build you are running (commit and host), in all four languages.

### Changed

- MIDI keyboards were tested on real devices with a Roland FP-30X: connect, velocity, plugging in and out, and the sustain pedal work in desktop Chrome and in Android Chrome over USB-OTG.

### Known issues

- Both hosts stay for now: GitHub Pages as production and Cloudflare for branch previews.

## 2026-10-25 — Phase 2: play the piano

### Added

- The start screen is now a free-play piano. Every key press makes a sound and lights up the key on screen.
- Play with the computer keyboard: `A S D F G H J K L ;` are the white keys, `W E T Y U O P` the black keys, and `Z` / `X` shift the octave. Keys follow their physical position, so QWERTZ and AZERTY keyboards work too, and in Chrome the key labels match your layout.
- Play the on-screen piano with a mouse, pen, or several fingers at once. The octave buttons move the two-octave range (C3–C5 by default).
- Connect a MIDI keyboard in Chrome or Edge with **Connect MIDI keyboard**. All connected keyboards work, including velocity and the sustain pedal. Plugging in or out is picked up without a reload. Clear messages explain when MIDI is blocked, unsupported, or needs a secure page.
- Note names follow your language: C D E… in English, C D E… H in German, до ре мі… in Ukrainian, do ré mi… in French.
- Volume slider and mute button; both are remembered.

### Known issues

- Connecting a real MIDI keyboard has not been tested on a device yet. The on-screen piano and computer keyboard were tested.

### Removed

- The "coming soon" placeholder message.

## 2026-10-25 — Phase 1: project scaffold

### Added

- The app opens a placeholder start screen at `http://localhost:3000` (`bun run dev`).
- The interface is available in English, Ukrainian, German, and French. On the first visit it follows the browser language and falls back to English. The language selector switches languages instantly and remembers your choice. If browser storage is blocked, switching still works for the current session.
- For developers: type check, ESLint, Prettier, unit tests, and a GitHub Actions CI that runs them on every pull request.
