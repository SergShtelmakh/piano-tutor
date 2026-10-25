# Locked lessons and unlock gates

## Problem

Phase 6 ships 13 lessons with no locks (decided during spec review), so a new learner sees everything at once. Only a **Next** badge on the first lesson without a finished run suggests an order.

## Idea

Lock lessons until the previous one is finished (1★) or finished well (2★, ≥ 80 %), with a lock icon and "Finish <lesson> to unlock" on the card.

## Rough approach

- Pure rule in `src/core/lessons.ts` next to `nextLessonId`: `isUnlocked(entry, records)`; the rule can live per unit or per entry.
- `LessonCard` gets a locked state (disabled Start, text reason, not colour only).
- Existing progress needs no migration: unlocks are computed from the saved per-lesson records.
- Decide what happens to a learner who already finished later lessons (always unlocked).

## Open questions

- 1★ or 2★ as the gate? Stricter gates may block beginners.
- Lock whole units, or single lessons?
- An "unlock all" option for learners who can already read music, or for testing.
