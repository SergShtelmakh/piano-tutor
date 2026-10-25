# Plan — Game mechanics & local progress

> Roadmap phase: Phase 5 — Game mechanics & local progress
> Branch: `feature/game-mechanics-local-progress`
> Status: Implemented

## Goal

The learner opens the app on a Home screen with their level, XP, and daily streak, and a list of lessons with their best stars and accuracy. Finishing a lesson earns stars and XP, keeps the streak going, and shows the rewards in the summary. Progress survives a reload.

## Approach

**Progress core — `src/core/progress.ts`** (pure, unit-tested; FR-1 – FR-7, FR-9)

- Types:
  - `Stars = 0 | 1 | 2 | 3`.
  - `LessonRecord { bestAccuracy: number; bestStars: Stars; completions: number }`.
  - `Progress { version: 1; xp: number; streak: { current: number; best: number; lastDay: string | null }; lessons: Record<string, LessonRecord> }`.
  - `RunReward { stars; xpGained; levelBefore; levelAfter; streak; newBestStreak: boolean; newBestAccuracy: boolean }`.
- `EMPTY_PROGRESS`.
- `starsFor(accuracy): Stars` (1 / 2 / 3; the caller only passes finished runs) and `xpFor(stars)`.
- `xpForLevel(level)` = `25 * level * (level - 1)`; `levelFor(xp)`; `levelProgress(xp): { level; into; needed }` for the bar.
- `dayDiff(from, to)`: whole days between two `YYYY-MM-DD` strings, computed via `Date.UTC` on the parsed parts (no time zone or DST effects). The local date string itself is made outside the core.
- `currentStreak(progress, today)` for display (FR-5).
- `recordRun(progress, lessonId, accuracy, today): { progress; reward }`: applies FR-1 – FR-4 and FR-6, returns a new object (no mutation).
- `parseProgress(raw: string | null): Progress`: `JSON.parse` in `try/catch`, then field-by-field validation (FR-9); anything invalid → `EMPTY_PROGRESS`. Invalid lesson records are dropped one by one; valid ones with unknown ids are kept.
- `progress.test.ts`: stars at 0.79, 0.7999, 0.8, 0.94, 0.95, 1; XP per stars; levels at 0 / 49 / 50 / 149 / 150 / 500 XP and `levelProgress` numbers; `dayDiff` across a month end, a year end, and a leap day; streak: first run, same day, next day, two-day gap, clock backwards, best streak kept; `currentStreak` today / yesterday / older; best accuracy and stars never go down; completions count; "new best" flags (not on the first run); level-up detection; `parseProgress` with `null`, garbage, wrong version, wrong types, negative numbers, a valid round trip, unknown lesson id kept.

**Lesson catalog — `src/core/lessons.ts`** (FR-13)

- `LessonEntry { id; titleKey: MessageKey; create(random: RandomSource): Lesson }` and `LESSON_CATALOG: readonly LessonEntry[]` with the note-reading lesson. A test checks that ids are unique and match the `id` of the lesson each entry creates.

**Storage and React glue — `src/progress/`** (FR-8, FR-10, FR-15 – FR-17)

- `storage.ts`: `loadProgress(): { progress; available: boolean }` and `saveProgress(progress): boolean` with `try/catch`, same style as `i18n/storage.ts` and the audio settings. Key `piano-tutor.progress`. `clearProgress()` removes the key. `available` is false when a probe write/read throws.
- `today.ts`: `localDay(date = new Date())` → `YYYY-MM-DD` from the local date parts (kept outside the core because it reads the clock and the time zone).
- `context.ts` + `ProgressProvider.tsx`: holds `Progress` in state; exposes `useProgress()` → `{ progress, storageAvailable, recordRun(lessonId, accuracy) → RunReward, reset() }`. `recordRun` calls the core with `localDay()`, saves, updates state, and returns the reward. Wraps the app in `main.tsx` / `App.tsx` next to the other providers.

**Recording exactly once — `src/lesson/useLesson.ts`** (FR-15)

- `useLesson(createLesson, onFinish?)`: the bus listener already sees the `judge` result that sets `finished`; when the previous state was not finished and the new one is, it calls `onFinish(lesson, state)` once, from the listener (not from an effect, so Strict Mode's double effects cannot record twice). The callback is read through a ref so a new function identity does not resubscribe.
- `LessonScreen` passes an `onFinish` that calls `recordRun(lesson.id, accuracy(state))` and keeps the returned `RunReward` in state for the summary; `restart` clears it.

**UI — `src/components/`** (thin; FR-11 – FR-17)

- `ModeSwitch.tsx`: modes `home` and `free`; `App` mode becomes `'home' | 'free' | 'lesson'` plus the id of the open lesson. In `lesson`, no button is pressed; pressing one leaves the lesson.
- `HomeScreen.tsx`: `StatsBar`, the storage note (FR-10), the lesson list (`LessonCard` per catalog entry), and `ResetProgress`.
- `StatsBar.tsx`: level, XP bar (`<progress>` or `role="progressbar"` with `aria-valuenow`/`max` and a visible "120 / 150 XP"), streak and best streak.
- `StarRating.tsx`: three star glyphs (filled / empty, SVG or text `★`/`☆`) with `role="img"` and a translated label "N of 3 stars".
- `LessonCard.tsx`: title, `StarRating`, best accuracy (`formatPercent`) or "Not played yet", runs count, **Start**.
- `ResetProgress.tsx`: the two-step confirmation.
- `LessonScreen.tsx`: takes the catalog entry; Back → Home. `LessonSummary.tsx`: gets `reward?: RunReward` and shows stars, "+N XP", level up, streak, new best streak, new best accuracy.
- `lessonBack` text changes to "Back to home" in all locales.

## Task groups

1. **Progress core**
   - [x] `src/core/progress.ts`: types, stars, XP, levels, day diff, streak, `recordRun`, `parseProgress`
   - [x] `src/core/progress.test.ts` as in Approach
   - [x] `LESSON_CATALOG` in `src/core/lessons.ts` and its test
2. **Storage and provider**
   - [x] `src/progress/storage.ts`, `today.ts`, `context.ts`, `ProgressProvider.tsx`; wire the provider in
   - [x] `useLesson` `onFinish` (once, from the bus listener)
3. **Home screen and navigation**
   - [x] `ModeSwitch` Home / Free play; mode and open lesson in `App.tsx`; Home is the default
   - [x] `HomeScreen`, `StatsBar`, `StarRating`, `LessonCard`, storage note, `ResetProgress`
   - [x] Back from the lesson and the summary goes to Home
4. **Rewards in the summary**
   - [x] `LessonScreen` records the run via `onFinish` and keeps the reward; `restart` clears it
   - [x] `LessonSummary` shows stars, +XP, level up, streak / new best streak, new best accuracy
5. **Strings and docs**
   - [x] New keys in `en`, then `uk`, `de`, `fr` (plural forms for days, runs, XP)
   - [x] `README.md` "How to play": Home, stars, XP, streak, reset
   - [ ] Check 360 px; run every check in `validation.md`

## Files touched

| File                                                                                                     | Change                                                    |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `src/core/progress.ts`, `progress.test.ts`                                                               | New: stars, XP, levels, streak, record, parse; tests      |
| `src/core/lessons.ts`, `lessons.test.ts`                                                                 | Lesson catalog; test                                      |
| `src/progress/storage.ts`, `today.ts`, `context.ts`, `ProgressProvider.tsx`                              | New: `localStorage` wrapper, local day, provider and hook |
| `src/lesson/useLesson.ts`                                                                                | `onFinish` callback, called once                          |
| `src/components/ModeSwitch.tsx`, `App.tsx`                                                               | Home / Free play; open lesson state                       |
| `src/components/HomeScreen.tsx`, `StatsBar.tsx`, `StarRating.tsx`, `LessonCard.tsx`, `ResetProgress.tsx` | New                                                       |
| `src/components/LessonScreen.tsx`, `LessonSummary.tsx`                                                   | Catalog entry, record run, rewards, Back → Home           |
| `src/i18n/locales/{en,uk,de,fr}.ts`                                                                      | New strings; `lessonBack` → "Back to home"                |
| `README.md`                                                                                              | How to play: Home and progress                            |

## New dependencies

None. `localStorage`, `JSON`, and `Date.UTC` are built in; stars and the XP bar are plain markup.

## Risks & open questions

- **Recording twice.** Strict Mode runs effects twice in development, and a re-render could repeat side effects. Recording from the bus listener at the moment `finished` flips (old state not finished, new state finished) avoids both; a test-free hook, so it is checked by hand in `validation.md` (one run → completions + 1, XP + N, not 2×).
- **Local day and time zones.** The day comes from the device's local date; travelling across time zones can skip or repeat a day. Accepted; the "clock backwards" rule keeps the streak from breaking on a repeat.
- **Two tabs.** Each tab holds its own copy in memory and the last save wins, so a run in one tab can overwrite another's. Accepted for now (out of scope); a `storage` event listener could fix it later.
- **Schema changes.** `version: 1` lets a later phase migrate; until then any other version is treated as no progress, which would lose data if the version were bumped without a migration. The replan for later phases must keep this in mind.
- **Testing the streak by hand** needs a different date. The validation edits `lastDay` in DevTools (Application → Local Storage) instead of changing the system clock.
- **XP farming** with Play again is possible (15–25 XP per two-minute run). Fine at this scale; the curve grows with the level.
