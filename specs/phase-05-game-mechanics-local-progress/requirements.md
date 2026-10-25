# Requirements — Game mechanics & local progress

## Context

Roadmap Phase 5: give the learner a reason to come back tomorrow. Phase 4 delivered one playable lesson (random note reading on a grand staff) with a summary, but nothing is remembered: every visit starts from zero. This phase adds **stars**, **XP and levels**, a **daily streak**, and a **Home screen** that lists the lessons with their best result. Everything is saved on the device in `localStorage` (mission principle 5: privacy by default) and the app keeps working when storage is unavailable.

There is still only one lesson ("Note reading"). The Home screen is built as a list, so Phase 6 can add lessons without changing the screen. Unlock order is Phase 6.

The clarifying questions and their answers are in the **Decisions** table below. Rows marked _(agent default)_ were not asked; review them.

## Functional requirements

**Scoring rules (pure)**

- **FR-1** Every **finished** lesson run earns **stars** from its accuracy (Phase 4, FR-4): **1★** for any finish, **2★** at ≥ 80 %, **3★** at ≥ 95 %. The thresholds compare the exact ratio, not the rounded percentage (79.6 % is 1★ even though it displays as "80 %").
- **FR-2** A finished run earns **XP = 10 + 5 × stars** (15 / 20 / 25). A run that is abandoned (Restart, Back, leaving the screen, closing the tab) earns nothing and is not recorded. **Play again** after a finish starts a new run that is recorded again when it finishes.
- **FR-3** **Levels** come from total XP. Reaching level _L_ needs **25 × L × (L − 1)** XP in total: level 1 at 0, level 2 at 50, level 3 at 150, level 4 at 300, level 5 at 500. There is no maximum level. The app shows the level and the progress toward the next level (XP into the level / XP the level needs).
- **FR-4** **Daily streak**: a day counts when at least one lesson is finished on that **local calendar day** (the device's time zone). When a run finishes:
  - if the last practice day is today, the streak does not change;
  - if it is yesterday, the streak goes up by 1;
  - otherwise (no earlier day, or a gap of two or more days) the streak becomes 1.
  - The **best streak** is the highest streak ever reached.
  - If the device clock goes backwards (the last practice day is after today), the streak does not change and the last day is kept.
- **FR-5** The **shown** streak is computed for today: if the last practice day is today or yesterday, the stored streak is shown; otherwise the shown streak is 0. Opening the app does not write anything; the stored value changes only when a run finishes.
- **FR-6** Per lesson the app keeps the **best accuracy**, the **best stars**, and the **number of finished runs**. A run with lower accuracy never lowers the best values.
- **FR-7** All rules in FR-1 – FR-6 live in a pure module in `src/core/` (no React, DOM, storage, or clock access; "today" is passed in as a `YYYY-MM-DD` string) and are unit-tested.

**Saving progress**

- **FR-8** Progress is saved to `localStorage` under one key as versioned JSON, right after each recorded run, and loaded on startup. Reading and writing are wrapped in `try/catch`.
- **FR-9** Invalid saved data (not JSON, wrong version, wrong field types, negative numbers) must not crash the app: it is treated as no progress. Unknown lesson ids are kept as they are (a later phase may add or remove lessons).
- **FR-10** When `localStorage` is unavailable (private mode, blocked site data, a throwing accessor) the app still works: progress is kept in memory for the session, and the Home screen shows a short note that progress cannot be saved in this browser.

**Home screen and navigation**

- **FR-11** The mode switch becomes **Home / Free play**. **Home** is the default on load. The lesson is opened from Home, not from the switch. While a lesson is open, the switch shows neither mode as selected and choosing a mode leaves the lesson (as Back does today). Language, volume, MIDI status, and the build footer stay available on every screen; the octave control stays in free play only.
- **FR-12** Home shows a **stats bar**: the level, an XP bar toward the next level with the numbers ("120 / 150 XP" style, translated), the shown streak (FR-5) in days with plural forms, and the best streak.
- **FR-13** Home shows a **lesson list** built from a lesson catalog in `src/core/` (one entry for now: "Note reading"). Each card shows the lesson title, the best stars (0–3, empty stars when never finished), the best accuracy (or "Not played yet"), and the number of finished runs, and a **Start** button that opens the lesson.
- **FR-14** The lesson's **Back** button (in the lesson and in the summary) returns to **Home**, and its label changes to "Back to home". Leaving still restores the octave (Phase 4, FR-12).

**Rewards on completion**

- **FR-15** When a run finishes, it is recorded **exactly once** (also under React Strict Mode), and the summary shows, in addition to Phase 4's content:
  - the stars earned in this run (filled and empty stars, with a text alternative such as "2 of 3 stars");
  - "+N XP";
  - **"Level up! You reached level N"** when this run crossed a level boundary;
  - the streak after this run, and a "New best streak!" note when it beat the previous best;
  - **"New best!"** when this run's accuracy beat the lesson's previous best (not on the first run).
- **FR-16** The level, XP, streak, and lesson card on Home reflect the run as soon as the learner goes back.

**Reset**

- **FR-17** Home has a **Reset progress** action with an in-page confirmation (two steps: "Reset progress" → "Are you sure? This cannot be undone." with **Reset** and **Cancel**). Confirming clears XP, level, streaks, and per-lesson results, in memory and in storage. Language, volume, and mute settings are not touched.

**Translations**

- **FR-18** Every new string exists in `en`, `uk`, `de`, `fr`, with plural forms where a count is shown (days, runs, XP).

## Non-functional requirements

- User-facing text goes through the translations module (English default; add keys for `uk`, `de`, `fr` too).
- Works with the on-screen and computer keyboard (no MIDI device required).
- No perceptible added input latency: recording a run happens once, at the finish, outside the per-note judge path.
- Pure core: scoring, levels, streaks, the progress record, and parsing/validation of saved data live in `src/core/` with unit tests; the storage wrapper and the React provider are thin.
- Layout works at 360 px width (stats bar, lesson card, summary).
- Stars and the XP bar do not rely on colour alone (text alternatives / numbers).
- No new runtime dependencies.

## Out of scope

- More lessons, unlock order, a curriculum (Phase 6).
- Streak freezes, reminders, notifications, daily goals beyond "one lesson".
- Badges / achievements, sound effects, confetti or other animations beyond simple CSS.
- XP or streak for free play.
- Syncing between devices or tabs (two open tabs: last write wins), export / import of progress.
- A history of runs or charts.
- A router or URLs per screen.

## Decisions

| Question                      | Decision                                                                                     | Reason                                                                                                         |
| ----------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| How XP is earned              | Per finished run: 10 + 5 × stars (15 / 20 / 25)                                              | Rewards accuracy; mashing keys or long lessons do not farm XP.                                                 |
| Star thresholds               | 1★ any finish, 2★ ≥ 80 %, 3★ ≥ 95 % (exact ratio)                                            | Finishing always earns something; 3★ needs near-perfect reading.                                               |
| What keeps the streak         | At least one finished lesson per local calendar day; no freezes                              | Simple, honest rule; matches "a reason to come back tomorrow".                                                 |
| Navigation                    | Home / Free play switch; Home is the default and holds the lesson list; lesson opens from it | The lesson list is the entry point Phase 6 will grow; Phase 4's Lesson tab was a stopgap.                      |
| Level curve _(agent default)_ | Total XP for level L = 25 × L × (L − 1)                                                      | Level 2 after 2–4 runs, each level a bit longer; one formula, no table.                                        |
| Storage _(agent default)_     | One `localStorage` key, versioned JSON; invalid data = no progress                           | Easy to migrate later; never crashes on bad data.                                                              |
| No storage _(agent default)_  | Keep progress in memory, show a short note on Home                                           | The app must work everywhere (mission principle 3); the learner should know why progress disappears.           |
| Reset _(agent default)_       | Reset progress on Home with an in-page confirmation                                          | Needed for testing and for sharing a device; in-page confirmation instead of `window.confirm` keeps it styled. |
| Dates _(agent default)_       | The core takes "today" as a local `YYYY-MM-DD` string; day gaps computed from those strings  | Keeps the core pure and testable; avoids DST issues of millisecond arithmetic.                                 |
| Abandoned runs                | Not recorded                                                                                 | Only a finished run has a fair accuracy.                                                                       |
