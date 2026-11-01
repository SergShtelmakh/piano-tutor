# Plan — Redesign: visual system and navigation

> Roadmap phase: Phase 18 — Redesign: visual system and navigation
> Branch: `feature/redesign`
> Status: Implemented; automated gates and the headless render pass done, manual validation open

## Goal

The app gets the dark, card-based look of the user's design canvas and a clear structure: a Home screen with large tiles, separate Lessons, Library, Free play, and Settings screens, a navigation rail or sidebar on wide screens, and a focused lesson screen. Everything the app does today still works the same way.

## Approach

- **Constitution first (`specs/tech-stack.md`)**: the Styling row gets "dark theme tokens in `src/index.css` (`@theme`), Manrope self-hosted"; the project layout gets a paragraph on the shell (`AppShell`, screens, `icons.tsx`) and the theme; a **font licence** line next to the other asset policies (OFL fonts only, recorded in `licenses/`).
- **Theme tokens (`src/index.css`)**: Tailwind 4 `@theme` defines the palette from `requirements.md` as `--color-*` tokens (`bg`, `surface`, `surface-raised`, `rail`, `line`, `line-strong`, `ink`, `ink-muted`, `staff`, `accent`, `accent-ink`, `accent-soft`, `warm`, `wrong`, `key-black`), the font (`--font-sans: 'Manrope', system-ui, …`), and the radii. Components use them as utilities (`bg-surface`, `text-ink-muted`, `border-line`, `fill-…`). A `wrong` colour is added (the canvas has none): a coral of different lightness than the teal, picked with the contrast test below. `body` gets `bg-bg text-ink`, plus a base `:focus-visible` ring in the accent colour.
- **Contrast is tested, not eyeballed (the canvas's staff colour `#5b6375` gave 2.86:1 on the card, so the `staff` token is `#6b7389`; `key-label` `#4b5265` was added for labels on the ivory keys)**: a pure `src/core/contrast.ts` (WCAG relative luminance and contrast ratio, unit-tested with known pairs), and `config/themeContrast.test.ts`, which reads the `@theme` block of `src/index.css` and checks a list of pairs (text on bg / surface ≥ 4.5, muted text on bg / surface ≥ 4.5, accent-ink on accent ≥ 4.5, accent on bg ≥ 3, wrong vs. accent lightness differ, etc.). If a canvas colour fails, the test fails and the token is adjusted minimally (and noted in the spec).
- **Font**: download the Manrope variable woff2 subsets (latin, latin-ext, cyrillic, cyrillic-ext) once from the Google Fonts css2 API, put them in `src/assets/fonts/` with `@font-face` rules (`unicode-range`, `font-display: swap`, weight 400–800) in `index.css`. Vite hashes them; `woff2` is added to the Workbox `globPatterns` so they are precached. `licenses/manrope.md` records the source, the OFL 1.1 text, and the check date; README credits in all four languages. `config/fontFiles.test.ts` checks the files exist, are small, and the licence record names OFL.
- **Logo and icons**: `public/icon.svg` becomes logo 13 on the `bg` colour (square, rounded, enough padding for maskable); `bun run icons` regenerates the PNG / ICO files (committed). The same mark is a `Logo` component (inline SVG, unique gradient ids via `useId`). `vite.config.ts` manifest: `theme_color: '#0E1117'`, `background_color: '#0E1117'`; `index.html` `theme-color` the same.
- **Shell and navigation (`src/App.tsx`, new `src/components/shell/`)**:
  - `Screen = 'home' | 'lessons' | 'library' | 'free' | 'settings'` replaces `Mode`; `ModeSwitch` is removed. Course and lesson state stay as today (`course.source`, `lessonId`), and their Back targets are unchanged (a course opened from Library returns to Library, from Lessons to Lessons).
  - `AppShell` renders one `Navigation` component beside the content: a rail from 768 px (`wide:` variant, which also needs height > 500 px, so a phone in landscape gets none) that becomes a sidebar from 1280 px (`sidebar:`); nothing while a lesson is open (FR-8). It reads one `NAV_ITEMS` list (screen, label key, icon). On phones top-level screens get a `ScreenHeader` (Back + title); on wide screens the header shows the title only.
  - `icons.tsx`: the dozen inline stroke icons the canvas uses (note, library, sliders, keyboard, home, back, play, plus, check, close, volume, mute, chevron), `aria-hidden`, `currentColor`.
- **Screens (thin components, no game rules)**:
  - `HomeScreen`: logo + name, heading, `ContinueCard` (from `nextLessonId(LESSON_CATALOG, progress.lessons)`), a compact `StatsBar`, `InstallCard`, the storage note, and `HomeTiles` (Lessons main tile with the finished count, Library, Free play, Settings). A `landscape` layout via a height media query (`[@media(max-height:500px)]`) puts them side by side.
  - `LessonsScreen` (new): the old Home content (units, `LessonCard`, `LearningPieces`, `ResetProgress`).
  - `PlayerScreen` / `LibraryPanel` / `PieceInfo` / `MarkToggles` / `DifficultyDots` / `Portrait`: restyled; the panel opens by default when no piece is open.
  - `FreePlayScreen` (new, small): play hint, `OctaveControl`, `MuteButton`, `PianoKeyboard`.
  - `SettingsScreen` (new): sections Language (`LanguageSelector` restyled as a labelled `<select>`), MIDI keyboard (`MidiStatus` + `KeyboardSizeControl`), Sound (`VolumeControl`), About (`BuildInfo`). `MidiStatus` keeps its connection in a provider-level place so leaving Settings doesn't disconnect: today it holds `disconnect` in component state, so the MIDI connection moves into a small `MidiProvider` (`src/input/`) that `MidiStatus` reads. This is the one behaviour-preserving refactor the move needs.
  - `LessonScreen`: the focused layout (header with Back, title, subtitle, progress bar, `MuteButton`; staff card; piano at the bottom). The keyboard-range notice, counters, and summary are restyled; `useLesson` is not touched.
- **Notation and piano colours**: `ScoreView`, `StaffView`, `NotationView`, and `PianoKeyboard` switch their colour classes / `fill` / `stroke` values to the tokens (one `COLOR` map per file, as `StaffView` already has). The hard-coded `#0ea5e9` cursor in `ScoreView` becomes the accent token. No geometry changes.
- **Translations**: new keys in `locales/en.ts` first (screen names, `homeHeading`, `continueLabel`, tile subtitles, settings section titles, `mute` / `unmute` labels if not present), then `uk`, `de`, `fr`. Keys that become unused (`modeLabel`, `modeHome`, …) are removed from all four.

## Task groups

1. **Theme, font, logo** (no screen changes yet beyond the global background)
   - [x] Update `specs/tech-stack.md` (Styling row, layout paragraph, font licence line).
   - [x] `src/core/contrast.ts` + tests; `@theme` tokens, base styles, and focus ring in `src/index.css`; `config/themeContrast.test.ts`; adjust any failing token and note it in `requirements.md`.
   - [x] Manrope woff2 subsets in `src/assets/fonts/`, `@font-face` rules, `woff2` in the precache; `licenses/manrope.md`; `config/fontFiles.test.ts`; README credits in all four READMEs.
   - [x] `public/icon.svg` = logo 13; `bun run icons`; `Logo` component; manifest and `index.html` colours.
2. **Shell and navigation**
   - [x] `icons.tsx`, `NAV_ITEMS`, `Navigation`, `ScreenHeader`, `AppShell`; `Screen` state in `App.tsx`; remove `ModeSwitch` and the stacked header controls.
   - [x] `MidiProvider` (connection survives leaving Settings); `SettingsScreen` with Language, MIDI keyboard, Sound, About.
   - [x] `HomeScreen` (Continue card, stats strip, tiles, landscape layout) and `LessonsScreen`; `FreePlayScreen`; `MuteButton`.
   - [x] Translation keys (en, uk, de, fr); remove unused keys.
3. **Screens restyled**
   - [x] Cards and lists: `LessonCard`, `StarRating`, `StatsBar`, `LearningPieces`, `CourseScreen`, `ResetProgress`, `InstallCard`.
   - [x] Library / Player: `PlayerScreen`, `LibraryPanel`, `PieceInfo`, `MarkToggles`, `DifficultyDots`, `Portrait`; panel open by default.
   - [x] Lesson: focused `LessonScreen` layout, `LessonSummary`, keyboard-range notice; `KeyboardSizeControl`, `VolumeControl`, `OctaveControl`, notices (`UpdateBanner`, `OfflineReadyNote`, `PwaNotices`).
4. **Notation and piano on dark**
   - [x] `StaffView` and `ScoreView` (+ `NotationView`) colours per FR-16 / FR-4, cursor to accent.
   - [x] `PianoKeyboard` per FR-17 (keys, felt strip, pressed / flash / dimmed, ruler).
5. **Gates and checks**
   - [x] All automated gates.
   - [x] Render every screen with headless Chrome at 360 × 800, 844 × 390, 1024 × 768, and 1440 × 900 and compare with the canvas; fix overflow.
   - [ ] Manual pass from `validation.md` (keyboard-only navigation, MIDI on a real device, offline font).

## Files touched

| File                                                                                                                                                                                        | Change                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `specs/tech-stack.md`                                                                                                                                                                       | Styling row, layout, font licence line                 |
| `src/index.css`                                                                                                                                                                             | `@theme` tokens, `@font-face`, base styles, focus ring |
| `src/assets/fonts/*.woff2` (new)                                                                                                                                                            | Manrope subsets                                        |
| `src/core/contrast.ts`, `.test.ts` (new)                                                                                                                                                    | WCAG contrast                                          |
| `config/themeContrast.test.ts`, `config/fontFiles.test.ts` (new)                                                                                                                            | Token contrast, font files and licence                 |
| `licenses/manrope.md` (new)                                                                                                                                                                 | OFL record                                             |
| `public/icon.svg`, generated icons                                                                                                                                                          | Logo 13                                                |
| `index.html`, `vite.config.ts`                                                                                                                                                              | Theme colours, `woff2` precache                        |
| `src/App.tsx`                                                                                                                                                                               | `Screen` state, `AppShell`, providers                  |
| `src/components/shell/` (new): `AppShell`, `Navigation`, `ScreenHeader`, `navItems.ts`                                                                                                      | Navigation                                             |
| `src/components/icons.tsx`, `Logo.tsx` (new)                                                                                                                                                | Icons, logo                                            |
| `src/components/HomeScreen.tsx`, `LessonsScreen.tsx` (new), `FreePlayScreen.tsx` (new), `SettingsScreen.tsx` (new), `MuteButton.tsx` (new), `ContinueCard.tsx` (new), `HomeTiles.tsx` (new) | Screens                                                |
| `src/components/ModeSwitch.tsx`                                                                                                                                                             | Removed                                                |
| `src/input/MidiProvider.tsx`, `context.ts` (new / changed); `src/components/MidiStatus.tsx`                                                                                                 | MIDI connection outlives the Settings screen           |
| All other `src/components/*.tsx`                                                                                                                                                            | Restyled with tokens                                   |
| `src/i18n/locales/{en,uk,de,fr}.ts`                                                                                                                                                         | New keys, unused keys removed                          |
| `README.md`, `README.uk.md`, `README.de.md`, `README.fr.md`                                                                                                                                 | Font credit                                            |

The roadmap and the changelog are updated in the replan step.

## New dependencies

None. Manrope is committed as static woff2 files (SIL OFL 1.1), downloaded once; no npm package. Icons are inline SVG in the app's code.

## Risks & open questions

- **Size of group 3.** Restyling ~30 components is the bulk of the phase; it is mechanical but wide. If it grows, the Library / Player part can be split into its own commit.
- **MIDI connection lifetime.** Moving MIDI into Settings means the connection must live above the screens (`MidiProvider`). The connect flow itself (`midiAccess.ts`) stays unchanged; this needs a re-check on a real keyboard.
- **Canvas colours vs. contrast.** `#A7AEBF` on `#171B24` and `#5B6375` played notes are close to limits; the contrast test decides, and a token may move slightly from the canvas.
- **Phone landscape lesson.** Fitting the header, a grand staff, and the piano into 390 px height may need a smaller staff scale there; if it doesn't fit, the page scrolls (FR is "should").
- **Dimmed out-of-range keys** must stay visible on ivory keys against a dark page; checked in the render pass.
