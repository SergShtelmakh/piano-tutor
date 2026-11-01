# Requirements — Paper sheet music

## Context

Since the redesign (Phase 18) the notation is drawn light-on-dark: off-white notes and grey staff lines on the dark card. The user asked for sheet music "of the usual colour: black notes on white paper". Learners read printed music black on white, and the dark staff is harder to read for them.

This is roadmap Phase 22. It changes only how the notation is coloured. The rest of the app (shell, cards, piano) stays dark.

Decisions made while planning (see the table at the end):

- Paper is used **everywhere** the app draws notation.
- The paper is a **warm white**.
- The state colours stay the same but use **darker shades** that read on paper.
- A **switch** in Settings brings back the dark sheet music. Paper is the default.

## Functional requirements

- **FR-1** With the paper style, every notation view must be drawn as sheet music on a warm-white card (`#faf8f3`). This covers the course lessons, the built-in lessons, the Library's player, and the layout editor's example. Noteheads, stems, flags, beams, rests, clefs, key and time signatures, accidentals, ties, ledger lines, and bar lines are near-black. Staff lines are a mid grey. Open noteheads (half and whole notes) show the paper inside.
- **FR-2** With the paper style, the state colours must keep their meaning in darker shades. The current step, the playback cursor, the Player's playing notes, and a right press are dark teal. A wrong press is dark red. Played notes in a built-in lesson are grey. Every one of these must reach at least 3:1 against the paper. Right and wrong must also differ by lightness (at least 1.2:1 between the two), not only by hue.
- **FR-3** With the dark style, the notation must look exactly as before this phase.
- **FR-4** Settings must have a **Sheet music** section with a two-option control, **Paper** and **Dark**. Paper is the default, also for learners who used the app before this phase. A change applies at once to every notation view, including the layout editor's example.
- **FR-5** The choice must be saved on the device and kept after a reload. If the saved value is unknown, or if storage is blocked, the app falls back to paper and does not fail.
- **FR-6** The paper style must change only the notation card. The page, the header, other cards, the piano (keys, labels, the hint ring, the lit keys), and the lesson controls look as before.

## Non-functional requirements

- User-facing text goes through the translations module (English default; add keys for `uk`, `de`, `fr` too).
- Colours come only from theme tokens. The new paper tokens get pairs in `config/themeContrast.test.ts`.
- Works with the on-screen and computer keyboard (no MIDI device required).
- No perceptible added input latency. A note press redraws no more than it does today.
- No new dependencies.
- The saved lesson settings (`piano-tutor.lessonSettings`) and progress are unchanged.

## Out of scope

- A light theme for the whole app (Backlog, from Phase 18).
- Following the system's light / dark preference.
- A paper texture, a shadow, or a page-like frame. The card is flat.
- A sheet-music switch inside the layout editor or the lesson header. The editor shows the chosen style.
- Colouring notes by hand, voice, or pitch.

## Decisions

| Question                                                  | Decision                                                                                                                                                                       | Reason                                                                                                       |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Where does the notation become paper?                     | **Everywhere**: course and built-in lessons, the Library's player, and the layout editor's example.                                                                            | User choice (recommended): one look for notes across the app.                                                |
| What colour is the paper?                                 | **Warm white** `#faf8f3`, not pure white.                                                                                                                                      | User choice (recommended): reads like music paper and glares less next to the dark UI in the evening.        |
| How are the current note, cursor, right, and wrong shown? | **The same colours, darker**: teal `#0b7a68` (4.95:1 on paper), red `#b3261e` (6.16:1; 1.24:1 against the teal), played notes grey `#6b6f78` (4.74:1), ink `#16181d` (16.7:1). | User choice (recommended): the meaning stays the same and stays readable. Values checked against WCAG.       |
| Is there a paper / dark switch?                           | **Yes**, in Settings. Default is paper. It is saved on the device (`piano-tutor.sheetStyle`).                                                                                  | User choice. The switch lives in Settings only (agent's choice, open for review), next to the layout editor. |
