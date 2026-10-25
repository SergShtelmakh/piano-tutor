# Plan — First lesson: play the right notes

> Roadmap phase: Phase 4 — First lesson: play the right notes
> Branch: `feature/first-lesson`
> Status: Approved

## Goal

The learner opens the Lesson mode, sees a note on a music staff, finds and plays that key with any input, gets green / red feedback, and works through 20 random notes between B3 and C5. A summary shows accuracy, correct notes, and mistakes. Every new lesson has a new order.

## Approach

**Translations — `src/i18n/`** (FR-14, FR-15)

- `locales/en.ts` keeps plain strings and adds **plural entries** as objects, e.g. `mistakesCount: { one: '{count} mistake', other: '{count} mistakes' }`. Placeholders use `{name}`.
- Types: `TranslationKey` splits into `MessageKey` (string values) and `PluralKey` (object values), both derived from `en`. `PartialTranslations` allows a partial plural object per key (`uk` gives `one`, `few`, `many`, `other`).
- `core.ts` (pure) adds `interpolate(template, params)` (unknown placeholders stay as they are), `translate(locale, key, params?)`, and `translatePlural(locale, key, count, params?)`, which picks the form with `new Intl.PluralRules(locale).select(count)`, falls back to `other` and then to English, and passes `count` as a param. `formatPercent(locale, ratio)` uses `Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 })`.
- `context.ts`: `t(key, params?)` and a new `tp(key, count, params?)` via `usePluralT()`. Existing `t(key)` calls keep working.
- `core.test.ts`: interpolation; plural forms for `en` (1, 2) and `uk` (1, 2, 5, 11, 21, 22, 25); fallbacks to `other` and to English; percent formatting for `en` and `fr`.

**Lesson core — `src/core/`** (pure, unit-tested; FR-2 – FR-5)

- `lesson.ts`:
  - Types: `Lesson { id; titleKey: MessageKey; baseOctave; steps: readonly (readonly number[])[] }`, `LessonState { stepIndex; playedInStep: readonly number[]; correct; mistakes; finished }`, `Outcome = 'right' | 'wrong' | 'ignored'`.
  - `startLesson(lesson): LessonState`.
  - `judge(lesson, state, event): { state; outcome; note? }` with the rules in FR-3.
  - `currentTargets(lesson, state): readonly number[]` (empty when finished).
  - `accuracy(state): number` (0–1; 1 when nothing was played).
  - `titleKey` is typed against the translation keys by importing the type only (`import type`), so the core stays free of runtime i18n code.
- `lessons.ts` (FR-5):
  - `NOTE_READING_POOL`: the nine white-key MIDI numbers B3 (59), C4 (60), D4, E4, F4, G4, A4, B4, C5 (72).
  - `randomSequence(pool, length, random): number[]`: each step picks uniformly from the pool **minus the previous note** (the first step from the whole pool). `random` is a `() => number` in `[0, 1)`; the index is `Math.floor(random() * candidates.length)`, clamped to the last candidate in case a source returns exactly 1.
  - `createNoteReadingLesson(random): Lesson` with id `note-reading`, `baseOctave: 4`, 20 steps of one note each.
- `lesson.test.ts`: right note advances; wrong note counts and keeps the target; exact pitch; `noteoff` / `sustain` ignored; chord step needs all notes in any order, repeats ignored, a wrong note inside a chord counts; finishing; notes after finish ignored; accuracy (no mistakes = 1, 12 / (12 + 3) = 0.8).
- `lessons.test.ts`: with a fixed random source the sequence is the expected one; with random sources from `0` to `0.999` for 500 sequences, every note is in the pool, length is 20, and no two neighbours are equal; every note of the pool shows up when the source sweeps `[0, 1)`; two different sources give different sequences; a source returning exactly `1` does not crash.

**Staff position — `src/core/staff.ts`** (pure, unit-tested; FR-7, FR-8)

- A "diatonic index" counts white-key steps from middle C: `C4 = 0`, `D4 = 1`, … `B4 = 6`, `C5 = 7`, `B3 = -1`. It comes from `octaveOf` and the pitch class (`C D E F G A B` → `0..6`).
- `staffPosition(note): { clef: 'treble' | 'bass'; index: number; ledger: readonly number[] } | null`, returning `null` for black keys (the caller draws nothing, and the lesson data never contains one):
  - `clef`: `treble` for `note >= 60`, else `bass`;
  - `index`: the diatonic index above;
  - `ledger`: the indices of the ledger lines the note needs. Treble staff lines are at indices 2, 4, 6, 8, 10 (E4 G4 B4 D5 F5); bass staff lines are at -10, -8, -6, -4, -2 (G2 B2 D3 F3 A3). A treble note below the staff (index ≤ 0) gets a ledger line at every even index from 0 down to the note's index (or the one just beyond it if the note sits in a space); a treble note above the staff (index ≥ 12) gets one at every even index from 12 up; a bass note below the staff (index ≤ -12) gets one at every even index from -12 down. A bass note never needs a ledger line above the staff in this phase, because notes from C4 up are treble.
- Layout constants (`LINE_GAP`, staff height, the 2-line gap between the staves) stay in the component, not in the core; the core only returns indices.
- `staff.test.ts`: C4 → treble, index 0, ledger `[0]`; D4 → index 1, no ledger; E4 → index 2 (bottom treble line); B4 → 6; C5 → 7, no ledger; A5 → 12, ledger `[12]`; B3 → bass, -1, no ledger; A3 → bass, -2; C#4 → `null`.

**Input range — `src/core/` and `src/input/`** (FR-6)

- `computerKeymap.ts`: `KEY_OFFSETS.ShiftLeft = -1` (the B below the base C); `QWERTY_LABELS.ShiftLeft = '⇧'`; `codeForNote` and `noteForCode` handle the new offset. Tests: `ShiftLeft` at base C4 → B3 (59), at base C3 → B2; octave shift and clamping at the limits still hold (lowest note B0 = 23, highest C8 = 108).
- `notes.ts`: `keyboardRange(baseOctave)` returns 26 notes, from the B below the base C up to the C two octaves above it. `KEY_COUNT` becomes 26; tests are updated (for C3: 47 to 72).
- `computerKeyboard.ts`: no special case. `ShiftLeft` goes through the same path as every other key, including the rules for repeat, Ctrl / Alt / Meta, and form controls. A note started with `ShiftLeft` stops when `ShiftLeft` is released, as for the other keys.
- `keyboardLabels.ts`: the label for `ShiftLeft` falls back to `⇧` because `getLayoutMap()` has no entry for modifier keys.
- `PianoKeyboard.tsx` already builds its keys from `keyboardRange` and positions black keys from the white keys before them, so a leading white B needs no layout change; the white keys become 16 (from 15) and each is slightly narrower. The key row is checked at 360 px.

**Lesson glue — `src/lesson/useLesson.ts`** (React hook; FR-5, FR-10, FR-11, FR-12)

- `useLesson(createLesson: () => Lesson)`: builds the lesson with `createLesson()` (the app passes `() => createNoteReadingLesson(Math.random)`), subscribes to the note bus with `useNoteBus()`, runs `judge` on every event, and keeps `LessonState` in a ref plus React state, so judging is synchronous and the UI re-renders. Returns `{ lesson, state, targets, feedback, restart }`; `restart()` builds a new lesson (a new random order) and a fresh state. `feedback` is `{ note, kind: 'right' | 'wrong', id }`, cleared after 300 ms with a timer (the id restarts the flash when the same key is pressed again).
- On mount and on restart it sets the base octave to `lesson.baseOctave` (a new `setBaseOctave` is added to the input context), and on unmount it restores the octave that was active before the lesson.

**UI — `src/components/`** (thin; FR-1, FR-7, FR-9, FR-10, FR-12, FR-13)

- `StaffView.tsx`: an inline `<svg viewBox>` with `width: 100%`. It draws two five-line staves with a gap, a left barline (with a thin bracket line joining them), the clefs, the ledger lines, and one whole note (an ellipse with a thick stroke and a transparent fill). Coordinates come from `staffPosition` and a few layout constants. Props: `note: number | null`, `feedback?: 'right' | 'wrong'`. The notehead colour follows `feedback` (green / red), otherwise the text colour. The `<svg>` has `role="img"` and `aria-label={t('staffTargetLabel', { note: noteLabelFor(locale, note) })}`; no note name is drawn.
- Clefs: the Unicode glyphs 𝄞 (U+1D11E) and 𝄢 (U+1D122) as `<text>` with `font-family: 'Noto Music', 'Segoe UI Symbol', 'Apple Symbols', serif`. **Fallback decided here:** if a device does not show them (checked on Android Chrome in `validation.md`), embed a small subset of the OFL-licensed Noto Music font as an asset in `public/` (not an npm dependency) and load it with `@font-face`. A font file must have its licence noted in `README.md`.
- `PianoKeyboard.tsx` gets an optional prop `feedback?: { note; kind }`. Colour priority per key: feedback flash (green / red) > held (sky) > normal. Without the prop it behaves as today. There is no target highlight.
- `ModeSwitch.tsx`: two buttons (Free play / Lesson) with `aria-pressed`.
- `LessonScreen.tsx`: title, instruction, `StaffView`, progress, counters (`tp`), keyboard with feedback, Restart and Back buttons. When finished it renders `LessonSummary`.
- `LessonSummary.tsx`: "Lesson complete", accuracy, correct / mistakes counts, Play again and Back to free play.
- `App.tsx`: `mode` state (`'free' | 'lesson'`); free play renders the current layout; lesson renders `LessonScreen`. MIDI status, volume, octave control, language, and footer stay.

## Task groups

1. **Translations: interpolation and plurals**
   - [x] Types and plural entries in `locales/en.ts`; `interpolate`, `translate` with params, `translatePlural`, `formatPercent` in `core.ts`
   - [x] `t(key, params?)` and `usePluralT()` in `context.ts` / `I18nProvider.tsx`
   - [x] Tests in `core.test.ts` as in Approach
2. **Lesson core, random sequence, and staff position**
   - [x] `src/core/lesson.ts`, `lesson.test.ts`
   - [x] `src/core/lessons.ts` (pool, `randomSequence`, `createNoteReadingLesson`), `lessons.test.ts`
   - [x] `src/core/staff.ts`, `staff.test.ts`
3. **Input range and lesson hook**
   - [ ] `ShiftLeft` = B below the base C in `computerKeymap.ts`, 26-key `keyboardRange`, labels, updated tests
   - [ ] `setBaseOctave` in the input context
   - [ ] `src/lesson/useLesson.ts`
   - [ ] `PianoKeyboard` `feedback` prop and colours; check the extra key at 360 px
4. **Staff view, screens, and strings**
   - [ ] `StaffView` (grand staff, clefs, ledger lines, whole note, feedback colour, accessible label)
   - [ ] `ModeSwitch`, `LessonScreen`, `LessonSummary`; mode state in `App.tsx`
   - [ ] New keys in `en`, then `uk`, `de`, `fr` (mode names, lesson title, instruction, staff label, progress, counters, summary, buttons)
   - [ ] Check at 360 px, on Android Chrome (clef glyphs), and with each input source
5. **Docs**
   - [ ] `README.md` "How to play": the Lesson mode and the `⇧` key for B
   - [ ] Run every check in `validation.md`

## Files touched

| File                                                                          | Change                                                         |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `src/i18n/core.ts`, `core.test.ts`                                            | Interpolation, plurals, percent formatting; tests              |
| `src/i18n/context.ts`, `I18nProvider.tsx`                                     | `t` with params, `usePluralT()`                                |
| `src/i18n/locales/{en,uk,de,fr}.ts`                                           | Types for plural entries; new strings                          |
| `src/core/lesson.ts`, `lesson.test.ts`                                        | New: lesson model, judge; tests                                |
| `src/core/lessons.ts`, `lessons.test.ts`                                      | New: note pool, random sequence, the lesson; tests             |
| `src/core/staff.ts`, `staff.test.ts`                                          | New: note → clef, line index, ledger lines; tests              |
| `src/core/computerKeymap.ts`, `notes.ts` and their tests                      | `ShiftLeft` = B below the base C; 26-key range                 |
| `src/input/keyboardLabels.ts`                                                 | Label fallback for `ShiftLeft`                                 |
| `src/input/context.ts`, `NoteInputProvider.tsx`                               | `setBaseOctave`                                                |
| `src/lesson/useLesson.ts`                                                     | New: bus subscription, new sequence on restart, feedback timer |
| `src/components/StaffView.tsx`                                                | New: SVG grand staff with one note                             |
| `src/components/PianoKeyboard.tsx`                                            | `feedback` prop                                                |
| `src/components/ModeSwitch.tsx`, `LessonScreen.tsx`, `LessonSummary.tsx`      | New                                                            |
| `src/App.tsx`                                                                 | Mode state                                                     |
| `README.md`                                                                   | Lesson mode and `⇧` in "How to play"                           |
| `public/`, `src/index.css`, `README.md` (only if the clef fallback is needed) | Font subset, `@font-face`, licence note                        |

## New dependencies

None. `Intl.PluralRules` and `Intl.NumberFormat` are built into every target browser. The staff is hand-drawn SVG. A font file, if the fallback is needed, is a static asset, not a package.

## Risks & open questions

- **Clef glyphs may not render everywhere.** The musical symbols are in Unicode but not in every system font (Android is the likely problem). The plan lists the fallback (a font subset). We check on Windows Chrome and Android Chrome during validation.
- **`ShiftLeft` as a note key.** It is the key left of `Z` on most layouts, not left of `A`, so the piano shape is not perfectly matched (the key left of `A` is `CapsLock`, which is unreliable for key events on some systems, and `Tab` breaks focus navigation). Two things to watch: Windows offers **Sticky Keys** after five quick presses of Shift in a row (notes never repeat in this lesson, so a long run of B3 presses is not possible, but free play can trigger it), and shifted keys may report `shiftKey` (we ignore it, since only Ctrl / Alt / Meta are filtered). Checked in `validation.md`; if it feels wrong, a later change can move the key.
- **A 26-key range changes free play too.** The piano gets one more key on the left and the white keys are about 6 % narrower. The key labels are tight at 360 px, so we check them; if they do not fit, the white-key labels use one line.
- **Base octave change on lesson start** moves the computer keyboard and the on-screen range (B3–C6 instead of B2–C5) and would stay when the learner goes back to free play. Decided in the plan: restore it on leaving the lesson.
- **Random order is not seeded for the user.** Two learners, or one learner twice, never see the same sequence; nothing is stored. Reproducing a bug needs a fixed source in tests, which the generator supports.
- **Key labels on the piano still show note names** (and computer keys), so the learner can match the note to a labelled key. That is a good starting aid; a "hide labels" setting is out of scope.
- **Plural types**: the key type of `en` changes from "all strings" to "strings or plural objects". Every `t()` caller is checked by `tsc`; `t()` only accepts message keys, `tp()` only plural keys.
- **Feedback timer** lives in the hook (UI timing), not in the core, so the core stays time-free.
- **A key held before the lesson starts** is not judged; only new `noteon` events count.
- **Learners who shift the octave during the lesson** may push the target off the on-screen piano. The staff still shows the note; no extra handling in this phase.
- **Staff only handles white keys.** A lesson with sharps or flats needs key signatures and accidentals; that belongs with the lesson content in Phase 6.
