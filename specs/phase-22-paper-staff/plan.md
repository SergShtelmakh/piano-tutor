# Plan — Paper sheet music

> Roadmap phase: Phase 22 — Paper sheet music
> Branch: `feature/paper-staff`
> Status: Implemented (manual validation pending)

## Goal

By default the learner reads black notes on a warm-white card, like printed music. A switch in Settings brings back the dark sheet music.

## Approach

All notation colours already come from a few tokens: `text-ink`, `text-staff`, `text-accent`, `text-wrong`, `var(--color-accent)` for the cursor, `var(--color-surface)` for the inside of open noteheads, and `bg-surface` / `border-line` on the card. So the paper style needs no change in the drawing code. It is a **scope class** that redefines those custom properties for one subtree:

```css
.sheet-paper {
  --color-surface: var(--color-paper);
  --color-line: var(--color-paper);
  --color-ink: var(--color-paper-ink);
  --color-staff: var(--color-paper-staff);
  --color-accent: var(--color-paper-accent);
  --color-wrong: var(--color-paper-wrong);
}
```

Tailwind v4 utilities read `var(--color-…)`, so everything inside the scope follows. The new hex values are tokens in the `@theme` block, so the contrast test can read them.

The class goes on the root of the two notation components. `ScoreView`'s card covers course lessons, the Player, and the editor. For built-in lessons, `StaffView`'s card in `LessonScreen` gets the class too. The card wrapper moves into a small shared `SheetCard` or gets the class where it is drawn, whichever keeps `LessonScreen` thinner.

The setting is a small adapter like `src/audio/settings.ts`. `src/display/sheetStyle.ts` holds `loadSheetStyle` / `saveSheetStyle` (`'paper' | 'dark'`, key `piano-tutor.sheetStyle`, anything else is paper) and a module-level store with `subscribe`, so `useSheetStyle()` (`useSyncExternalStore`) gives every view the same value and a change in Settings redraws them at once. No provider is needed. The parsing is a one-line guard in the adapter, so there is no new core module.

Settings gets a **Sheet music** section before **Lesson layout**. It uses the existing `SegmentedControl` (Paper / Dark).

## Task groups

1. **Tokens and scope**
   - [x] Add `paper` `#faf8f3`, `paper-ink` `#16181d`, `paper-staff` `#6b6f78`, `paper-accent` `#0b7a68`, `paper-wrong` `#b3261e` to the `@theme` block of `src/index.css`.
   - [x] Add the `.sheet-paper` scope (above) after the theme.
   - [x] `config/themeContrast.test.ts`: `paper-ink` on `paper` ≥ 4.5; `paper-staff`, `paper-accent`, `paper-wrong` on `paper` ≥ 3; `paper-accent` against `paper-wrong` ≥ 1.2; `paper` against `bg` ≥ 7 (the card stands out from the page).
2. **The setting**
   - [x] `src/display/sheetStyle.ts`: type `SheetStyle`, `DEFAULT_SHEET_STYLE = 'paper'`, load / save (best effort, as in `audio/settings.ts`), `setSheetStyle` (saves and notifies), `subscribe`, `getSheetStyle`.
   - [x] `src/display/useSheetStyle.ts`: `useSyncExternalStore(subscribe, getSheetStyle)`.
   - [x] `src/display/sheetStyle.test.ts`: default, round trip, unknown value, throwing storage, and that listeners are notified.
3. **Apply it**
   - [x] `ScoreView`: add `sheet-paper` to the card when the style is paper.
   - [x] `StaffView` (built-in lessons): the card around it gets the class too.
   - [x] Check that no notation colour bypasses the tokens (no raw hex or `white` / `black` in `ScoreView`, `StaffView`, `NotationView`).
4. **Settings UI and strings**
   - [x] A `Sheet music` section in `SettingsScreen` with `SegmentedControl` Paper / Dark and a one-line description.
   - [x] Strings `sheetSectionTitle`, `sheetSectionText`, `sheetPaper`, `sheetDark` in `en`, then `uk`, `de`, `fr`.
5. **Checks**
   - [x] `bun run lint`, `format:check`, `build`, `test`.
   - [x] Headless Chrome on `bun run preview` at 390 × 844, 844 × 390, and 1440 × 900, in both styles: a built-in lesson (with a right and a wrong press), a course lesson, the Player while it plays, and the layout editor. Look at the screenshots, then switch in Settings and reload.

## Files touched

| File                                                | Change                                    |
| --------------------------------------------------- | ----------------------------------------- |
| `src/index.css`                                     | Paper tokens, `.sheet-paper` scope        |
| `config/themeContrast.test.ts`                      | Paper pairs                               |
| `src/display/sheetStyle.ts` (+ test)                | New: the saved setting and its store      |
| `src/display/useSheetStyle.ts`                      | New: the hook                             |
| `src/components/ScoreView.tsx`                      | Scope class on the card                   |
| `src/components/LessonScreen.tsx` / `StaffView.tsx` | Scope class on the built-in lesson's card |
| `src/components/SettingsScreen.tsx`                 | Sheet music section                       |
| `src/i18n/locales/{en,uk,de,fr}.ts`                 | Four strings                              |

## New dependencies

None.

## Risks & open questions

- The scope also redefines `--color-accent` for the focus ring of the Player's clickable score. The darker teal is still ≥ 3:1 on the paper, so the ring stays visible.
- A Tailwind utility that does not go through `var(--color-…)` (for example an opacity modifier like `text-ink/50`, which Tailwind v4 compiles with `color-mix` on the variable) still follows the scope. A raw hex in the drawing code would not. Task 3 checks this.
- Paper is the default for existing learners too, so their notation changes on the first load after the update. That is the intent of the request.
