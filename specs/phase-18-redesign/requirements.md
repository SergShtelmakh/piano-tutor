# Requirements — Redesign: visual system and navigation

## Context

The user drew a redesign of the whole app as a design canvas: [Piano Tutor — оновлений дизайн](https://claude.ai/artifact/8TBSo2UjJ2PTqZ4hoMbcrn) (phone portrait and landscape, tablet, desktop, the lesson screen, a layout editor, and 13 logo options). The app today is a single centred column on a light slate background with a mode switch (Home / Free play / Player) and every control (language, MIDI, keyboard size, volume) stacked on top of the screen.

The canvas does two things: it gives the app a **new look** (dark theme, one accent, the Manrope font, large rounded cards, a logo) and a **new structure** (a Home screen with large tiles, sub-screens with a back button, a navigation rail or sidebar on wide screens, a Settings screen, a focused lesson screen). It also shows **new features** that don't exist yet: a "My lessons" list fed from files and the library, library search, tempo / hand / pause controls and a "next note" hint inside a lesson, and a lesson layout editor (keyboard height, octave count, staff size, note names on keys).

That is too much for one phase. The user chose to do the **look and the navigation** now (this phase) and put the new features on the roadmap as later phases (19–21). Everything the app can do today stays, fitted into the new structure, including the parts the canvas doesn't show (Free play, the Player, the built-in curriculum, XP / level / streak / stars).

Design reference used by this spec (from the canvas):

| Token          | Value             | Use                                                     |
| -------------- | ----------------- | ------------------------------------------------------- |
| background     | `#0E1117`         | Page                                                    |
| surface        | `#171B24`         | Cards, inputs, header buttons                           |
| surface-raised | `#1F2430`         | Icon wells, chips inside cards                          |
| rail           | `#12161E`         | Navigation rail / sidebar                               |
| border         | `#2A3040`         | Card and divider lines                                  |
| border-strong  | `#3A4258`         | Secondary (outline) buttons                             |
| text           | `#F3F1EC`         | Main text, notes on the staff, white keys               |
| text-muted     | `#A7AEBF`         | Secondary text, labels                                  |
| staff-line     | `#5B6375`         | Staff lines, played (past) notes                        |
| accent         | `#5ED6C1` (teal)  | Primary buttons, current item, current note, right-hand |
| accent-ink     | `#04201B`         | Text on accent                                          |
| accent-soft    | `#1B2B2C`         | Selected list item / nav item background                |
| warm           | `#F4B860` (amber) | Progress bars, left-hand current note, library icon     |
| black-key      | `#0A0C11`         | Black piano keys                                        |

Font: **Manrope** 400–800. Radii: 12–14 px small controls, 16–20 px cards and buttons, 24–28 px large tiles. Controls 48–60 px high. Logo: option **13 "Pressed key"** (three keys, the middle one teal, two black keys over them).

## Functional requirements

### Look

- **FR-1 Dark visual system.** Every screen must use the dark palette above, defined once as theme tokens (Tailwind `@theme` in `src/index.css`) and used through them; no component keeps the old light slate / sky colours. The only light surfaces are the white piano keys and the note glyphs.
- **FR-2 Font.** All UI text must be set in Manrope, served from the app's own files (no request to Google at runtime) and precached, so it also works offline. It must cover the four UI languages (Latin with German and French letters, Cyrillic). While it loads, the system font is shown (`font-display: swap`).
- **FR-3 Logo and app icon.** Logo option 13 must appear in the navigation (rail / sidebar) and on Home next to the app name. It must replace `public/icon.svg`, and the PWA icons must be regenerated from it. The manifest `theme_color` / `background_color` and `<meta name="theme-color">` must follow the dark palette.
- **FR-4 Feedback colours.** The lesson and player colours must stay distinguishable on the dark background, and by lightness as well as by hue: the current step is teal, the current left-hand note in two-staff notation is amber, a right press is teal, a wrong press is a red/coral that is clearly darker or lighter than the teal, past notes are dimmed grey, and notes sounding in the Player are teal.

### Navigation

- **FR-5 Screens.** The app must have these top-level screens: **Home**, **Lessons**, **Library** (the current Player with its library panel), **Free play**, and **Settings**. An open lesson and an open course are shown as today (a course inside Lessons or Library, a lesson as its own focused screen). There is still no router: the screen is app state.
- **FR-6 Phone layout (< 768 px wide).** Home shows tiles for the other screens. Every other screen has a top bar with a **Back** button (to Home, or to the course for a course lesson, as today) and the screen title. There is no bottom bar.
- **FR-7 Wide layouts.** From 768 px wide a **navigation rail** (icons with short labels, 96 px items) sits on the left; from 1280 px it becomes a **sidebar** (logo + name, icon + label rows). The rail / sidebar lists Home, Lessons, Library, Free play, and Settings, marks the current screen (`aria-current="page"`, accent-soft background, teal text), and replaces the Back buttons of the top-level screens.
- **FR-8 Focused lesson.** While a lesson is open, the rail / sidebar is hidden and the lesson fills the window: a header with Back, the lesson title, a subtitle (unit or piece and hand), a progress bar (steps done / total), and a **mute** button; below it the staff card and the piano at the bottom, as in the canvas's "Active lesson" screen. Keys and judging behave exactly as today.

### Screens

- **FR-9 Home.** Home must show: the logo and app name, a heading ("What shall we play today?"), a **Continue** card for the next built-in lesson (the one with the **Next** badge today; the card is hidden when there is none) that opens it directly, a compact **stats strip** (level, XP bar, current streak), the install card when the browser offers install, the "progress is not saved" note when storage is blocked, and large tiles for Lessons (teal, the main tile, with the count of finished lessons), Library, Free play, and Settings. In phone landscape (height < 500 px) the Continue card and the tiles sit side by side, as in the canvas.
- **FR-10 Lessons.** The Lessons screen must show today's Home content (the curriculum by unit with stars and the **Next** badge, and the "Pieces you are learning" section) in the new card style, plus **Reset progress** at the bottom.
- **FR-11 Library.** The Library screen must be the current Player screen in the new style: the library panel (composers, portraits, difficulty filter, favourites, marks, Learn) is open when no piece is open, and the player controls, score, and piano follow. Opening a file from disk stays here.
- **FR-12 Free play.** The Free play screen must show the play hint, the octave control, and the full-width piano in the new style.
- **FR-13 Settings.** All settings must move to one Settings screen with sections: **Language** (a select list with the four languages by their own names), **MIDI keyboard** (connect button and status, the keyboard size panel), **Sound** (volume, mute, reverb, the loading / failed text and Retry), and **About** (the build line). The language selector, MIDI status, and volume control must no longer be stacked above every screen. The keyboard size panel stays unavailable while a lesson is open (it can't be reached from a lesson any more).
- **FR-14 Course and summary.** The course screen and the lesson summary must use the new card style (summary: stars, accuracy, XP gained, level-up, streak, Retry / Back buttons as today).
- **FR-15 Notices.** The update banner, the offline-ready note, the keyboard-range notice, and error texts must use the new style, and they must stay readable on the dark background.

### Notation and piano

- **FR-16 Notation on dark.** `ScoreView` (Player, course lessons) and `StaffView` (built-in lessons) must draw light-on-dark inside a surface card: staff lines and bar lines in `staff-line`, clefs, notes, rests, beams, and signs in `text`, with the feedback colours of FR-4. Nothing in the layout or geometry changes.
- **FR-17 Piano on dark.** `PianoKeyboard` must draw ivory keys (`text` colour) with rounded bottoms on a dark felt strip, black keys in `black-key`, pressed / sounding keys in teal, flashes per FR-4, out-of-range keys still visibly dimmed, and the octave ruler in the dark style. Layout, sizing, scrolling, and touch behaviour stay the same.

## Non-functional requirements

- User-facing text goes through the translations module (English default; add keys for `uk`, `de`, `fr` too). New strings: screen names, the Home heading, the Continue label, the tile subtitles, the Settings section titles.
- Works with the on-screen and computer keyboard (no MIDI device required).
- No perceptible added input latency; no change to the note pipeline, judging, scoring, or saved data (all `localStorage` keys and formats unchanged).
- Accessibility: text contrast at least 4.5:1 against its background (3:1 for text 24 px and larger and for graphics such as the focus ring and staff lines); a visible focus ring on every control; touch targets at least 44 × 44 px; real `<button>` / `<a>` / `<select>` elements; icon-only buttons have an `aria-label`.
- No horizontal page scroll at 360 px wide; the phone landscape lesson (844 × 390) should fit the header, the staff, and the piano without vertical page scroll.
- Icons are inline stroke SVGs in the app's own code (no icon library, no emoji).
- No new runtime dependencies.

## Out of scope

- New features shown on the canvas: the "My lessons" list and adding lessons from a file or the library (Phase 19, planned), tempo / hand / pause controls and the next-note hint in lessons (Phase 20, planned), the lesson layout editor (Phase 21, planned), library search and difficulty chips as on the canvas (Backlog).
- A light theme or a theme switch (the canvas is dark only; "Dark mode / theming" in the Backlog becomes "a light theme").
- Language flags (the canvas shows flags; languages are not countries, so the select shows the language names only. Easy to add later if wanted).
- Browser Back / history integration (the screen stays app state).
- Changes to lesson content, the judge, scoring, the player, or notation geometry.

## Decisions

| Question                                                                              | Decision                                                                                                                                                                | Reason                                                                                                                                             |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| The canvas is too big for one phase. What is Phase 18?                                | **Visuals + navigation**: the new look, the new Home, Settings, rail / sidebar, and every existing screen restyled. The new features go to the roadmap as Phases 19–21. | User decision. Keeps the phase within ~5 task groups and one reviewable PR.                                                                        |
| Features missing from the canvas (Free play, Player, curriculum, XP / streak / stars) | **Keep them all**, fitted into the new structure: Lessons screen (curriculum + learning pieces), Library = Player, a Free play screen, a stats strip on Home.           | User decision. Nothing the learner has today disappears.                                                                                           |
| Themes                                                                                | **Dark only**; sheet music is redrawn light-on-dark.                                                                                                                    | User decision. Matches the canvas; the smallest phase.                                                                                             |
| Font and logo                                                                         | **Self-host Manrope** (SIL OFL 1.1, woff2 in the repo, precached; no npm package) and make **logo 13** the app icon.                                                    | User decision. The app is an offline PWA, so no runtime request to Google Fonts.                                                                   |
| What does "Continue" open?                                                            | The next built-in lesson (today's **Next** badge, `nextLessonId`).                                                                                                      | Progress stores no "last played" time, and adding one would change the saved format. A "last played" Continue can come with Phase 19 (My lessons). |
| What does "Library" open?                                                             | The current Player screen with the library panel.                                                                                                                       | The library already lives inside the Player; a separate library screen with search belongs with Phase 19.                                          |
| Where do volume and mute live?                                                        | Volume, mute, and reverb in Settings; a **mute** icon button in the lesson header, Free play, and the Player.                                                           | The canvas has no sound control on the play screens, but muting mid-lesson must stay one tap away.                                                 |
