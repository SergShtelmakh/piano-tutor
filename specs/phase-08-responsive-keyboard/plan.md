# Plan — Responsive on-screen keyboard

> Roadmap phase: Phase 8 — Responsive on-screen keyboard
> Branch: `feature/responsive-keyboard`
> Status: Implemented (manual validation open)

## Goal

The on-screen piano fits the screen: comfortable keys on a phone (with a scrollable piano), more octaves on a laptop, and the full 88 keys on a wide monitor. The keys the learner needs are always in view.

## Approach

**Core (pure, `src/core/keyboardLayout.ts`, new)**

- Constants: `MIN_WHITE_KEY_WIDTH = 40`, `PIANO_LOW = 21` (A0), `PIANO_HIGH = 108` (C8).
- `shownRange(width, baseOctave) → { low, high }`: FR-2 / FR-3. It starts from `keyboardRange(baseOctave)`, then adds whole octaves alternating below / above while `whiteCount × 40 ≤ width`, clipped to A0–C8 (an octave cut by A0 or C8 adds only the keys that exist).
- `keyLayout(range, width) → { whiteWidth, totalWidth, scrolls, keys: { note, black, x, w }[] }`: x and width in px for every key (white keys side by side; black keys centred on the boundary, 0.6 × white width, as today). If `scrolls` is true, the white width is 40 and `totalWidth > width`; otherwise `totalWidth === width`.
- `scrollTarget(layout, notes, viewport: { left, width }) → number | null`: FR-5. It returns `null` if all `notes` are fully inside the viewport. Otherwise it returns a `scrollLeft` that brings them in (centred when they fit, else starting at the lowest), clamped to `[0, totalWidth − width]`.
- `notes.ts` keeps `keyboardRange` and `KEY_COUNT` as the base range.

**UI**

- `src/components/useElementWidth.ts` (new, thin): a `ResizeObserver` on a ref, which reports the content width rounded to whole px, once per animation frame (FR-6).
- `PianoKeyboard`:
  - Measures its container, then computes `shownRange` and `keyLayout` with `useMemo` on `(width, baseOctave)`.
  - Renders keys with absolute pixel positions from the layout instead of `flex-1` / percentages, inside an `overflow-x-auto` scroller when `scrolls` is true. The keys keep `touch-action: none`.
  - Renders the **octave ruler** (FR-4) above the keys when `scrolls` is true: a strip with `touch-action: pan-x`, C labels at their x positions, and `aria-label` "Scroll the piano".
  - Effects for FR-5: on `width` change, base octave change, and a new `focusNotes` prop (from `LessonScreen`: the current step's notes), it calls `scrollTarget` and `scrollTo({ behavior: 'smooth' })`. It skips this while `pressed.current` (pointer-held keys) or the held-notes set is non-empty.
  - FR-6: when the layout changes, every pointer-held note that is no longer in the range gets `noteoff`.
- **Full-bleed layout (FR-1):** the piano gets a wrapper that spans the window inside a 16 px gutter while it stays inside `main`: `w-[calc(100vw-2rem)]` would include the vertical scrollbar width on desktop, so use `relative left-1/2 w-[calc(100dvw-2rem)] -translate-x-1/2` with `document.documentElement.clientWidth` as a fallback check during validation. `main` gets `overflow-x-clip` so the page never scrolls sideways (FR-3). If this trick turns out fragile, restructure instead: render the piano outside `main` in `App` and pass the lesson's feedback down (spec first).
- `LessonScreen`: passes `focusNotes` (the current step's notes) to `PianoKeyboard`.
- `OctaveControl`: label key `computerKeysLabel` ("Computer keys") replaces `rangeLabel` (FR-9).

**Translations**: `computerKeysLabel`, `pianoScrollLabel` in `en`, `uk`, `de`, `fr`; remove `rangeLabel`.

## Task groups

1. **Layout core**
   - [x] `src/core/keyboardLayout.ts`: `shownRange`, `keyLayout`, `scrollTarget`, constants
   - [x] Unit tests: 330 px → base range, 40 px keys, scrolls; 640 px → base range, no scroll; 1000 px → one octave added below; 1280 px → one below + one above; 2560 px → A0–C8, no scroll; base octave 1 (only grows upward once A0 is reached) and 6 (only grows downward at C8); black-key x positions; `scrollTarget` returns `null` when visible, centres a step, and clamps at both ends
2. **Responsive piano**
   - [x] `useElementWidth` (ResizeObserver, rAF-throttled)
   - [x] `PianoKeyboard` renders from `keyLayout` with pixel positions; release held keys that leave the range (FR-6, FR-7)
   - [x] Full-bleed wrapper and `overflow-x-clip` on `main`; check no page-level horizontal scroll at 360, 768, 1280, and 1920 px (FR-1, FR-3)
3. **Scrolling and follow**
   - [x] Scroll container, octave ruler with `touch-action: pan-x`, C labels (FR-4)
   - [x] Follow effects: centre on mount / resize, follow octave changes, `focusNotes` from `LessonScreen`, never while a key is held (FR-5, FR-8)
4. **Octave control, translations, docs**
   - [x] `OctaveControl` label "Computer keys" (FR-9); new / removed keys in `en`, `uk`, `de`, `fr` (FR-10)
   - [x] `README.md`: update the on-screen piano bullet (width-dependent range, ruler on phones)
   - [ ] Run `validation.md`: automated gates, then manual checks at several widths and on an Android phone; ask the user to skim the new `uk` / `de` / `fr` strings

## Files touched

| File                                                         | Change                                                                        |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `src/core/keyboardLayout.ts`, `keyboardLayout.test.ts` (new) | Range rule, key geometry, scroll target                                       |
| `src/components/useElementWidth.ts` (new)                    | ResizeObserver hook                                                           |
| `src/components/PianoKeyboard.tsx`                           | Pixel layout, scroller, ruler, follow effects, release on shrink              |
| `src/components/LessonScreen.tsx`                            | Pass `focusNotes`                                                             |
| `src/components/OctaveControl.tsx`                           | New label                                                                     |
| `src/App.tsx`                                                | `overflow-x-clip` on `main`; full-bleed wrapper if not inside `PianoKeyboard` |
| `src/i18n/locales/{en,uk,de,fr}.ts`                          | `computerKeysLabel`, `pianoScrollLabel`; remove `rangeLabel`                  |
| `README.md`                                                  | On-screen piano description                                                   |

## New dependencies

None.

## Risks & open questions

- **Full-bleed inside a centred column:** `100dvw` includes the desktop scrollbar width in some browsers, which can cause a few px of page overflow. `overflow-x-clip` on `main` hides it, but the piano could then lose a few px on the right. Check at validation; the fallback is to restructure `App` (see Approach).
- **Smooth scroll vs fast play:** if follow-scrolling fires while the learner moves to the next note, the key under the finger may move. FR-5 skips scrolling while a key is held; check on a phone whether that's enough or the scroll should wait for a short pause.
- **Key labels at 40 px:** note names in `uk` / `fr` (до, ré, …) at `text-[10px]` should fit; check at 40 px.
- **Rendering 88 keys:** 88 absolutely positioned buttons are cheap, but held-note re-renders now touch more keys. Keep the per-key props simple; check that there is no visible lag on Android.
- **Thresholds:** 40 px and "whole octaves only" are first guesses (the backlog note said 36–64 px); tune on real devices during validation and record the final values.
