# Requirements — Lesson layout editor

## Context

Roadmap Phase 21, the last feature of the user's redesign canvas ([Piano Tutor — оновлений дизайн](https://claude.ai/artifact/8TBSo2UjJ2PTqZ4hoMbcrn), artboard `LayoutEditor`). The canvas shows a full-window editor titled "Lesson layout" ("This is how every lesson will look. Change the sizes while an example plays."): a staff preview, a panel with segmented choices for **keyboard height** (S / M / L / XL), **octaves on screen** (2 / 3 / 4) and **staff size** (S / M / L), two switches (**note names on keys**, **highlight the next note**), a "drag to change the keyboard height" handle above the piano, and **Reset** / **Done** in the header.

Today a lesson's piano has one height (176 px, 112 px on a phone held sideways), shows as many octaves as fit (white keys at least 40 px wide) plus every note of the lesson, and names every white key. The staff of a built-in lesson is at most 576 px wide, and a course lesson's score is drawn at one fixed scale. Phase 20 added a settings store for every lesson (`piano-tutor.lessonSettings`: tempo, metronome, hint) and the Hint toggle; this phase adds the layout fields to the same store and reuses `hint` for the editor's "highlight the next note".

Decisions made while planning (see the table at the end): the editor opens from **Settings** only (no new button in the lesson header); the example is a **silent built-in loop**; octaves are **Auto** (today's behaviour, the default) or a fixed **2 / 3 / 4**; note names are **off by default**, as on the canvas.

## Functional requirements

### Opening the editor

- **FR-1** Settings must have a **Lesson layout** section with a one-line description and an **Edit layout** button. The button opens the editor as a full-window screen (no navigation rail or sidebar, like a lesson). The editor header has a **Back** icon button, the title and subtitle, **Reset**, and **Done**; Back and Done both return to Settings. The phone's or browser's Back gesture behaves as on the other screens (no history entry).

### The example

- **FR-2** The editor must show a built-in example the way a lesson shows it: a short two-staff passage (treble melody, bass notes) in the course-lesson notation, the piano below it, and a cursor that moves to the next step about every 0.75 s and starts over at the end. The keys of the current step light up and, when the hint is on, get the hint ring. The example makes **no sound**; keys pressed by the learner sound as everywhere else but change nothing. The loop stops while the editor is hidden (another tab) and, with `prefers-reduced-motion`, still steps but without animated scrolling.

### The settings

- **FR-3 Keyboard height.** A segmented control **S / M / L / XL** (default **M**) must set the height of the lesson's piano: 140 / 176 / 216 / 256 px, and on a short screen (a phone held sideways, the existing `short` variant) 96 / 112 / 128 / 144 px. **M** is today's height. Black keys stay at the same share of the white keys' height as today. The section label above the preview's piano names the size ("Keyboard · medium").
- **FR-4 Drag to resize.** A handle between the preview and the piano ("Drag to change the keyboard height") must change the keyboard height by dragging up or down with a mouse, finger, or pen, snapping to the nearest of the four sizes while dragging (the segmented control follows). It is also a keyboard-operable slider: it is reachable with Tab, the arrow keys (and Page Up / Down, Home / End) move between the four sizes, and it announces the current size.
- **FR-5 Octaves on screen.** A segmented control **Auto / 2 / 3 / 4** (default **Auto**) must set how many octaves the lesson's piano shows. **Auto** is today's behaviour. With **2 / 3 / 4**, the piano is sized so that that many octaves (plus the closing C) fill its width, centred on the notes of the lesson (on the example's notes in the editor); white keys never become narrower than 40 px, so on a narrow screen a large count shows fewer octaves and the rest scrolls as on a phone today. When the lesson needs more octaves than chosen, the piano covers all of them and scrolls, and the view follows the current step as it does today.
- **FR-6 Staff size.** A segmented control **S / M / L** (default **M**) must scale the lesson's notation: the staff of a built-in lesson and the score of a course lesson are drawn at 0.8 / 1 / 1.25 times today's size (**M** is today). A larger size fits fewer bars on a line of a course lesson (the lines are laid out again for the narrower virtual width); a built-in lesson keeps its notes per page. On a short screen the notation still fits between the header and the piano at every size (the existing height limit scales with it but never pushes the piano off screen).
- **FR-7 Note names on keys.** A switch (default **off**) must choose between naming every white key (today's labels) and naming only the C keys (with their octave, as today) plus any key that is lit (pressed, sounding, or the example's current step). The computer-keyboard letters on the keys are unchanged in both cases.
- **FR-8 Highlight the next note.** A switch must turn the lesson hint on and off. It is the same setting as the **Hint** toggle in the lesson header (Phase 20): changing one changes the other.
- **FR-9 Live and saved.** Every change must apply to the preview at once and be saved on the device in `piano-tutor.lessonSettings` (still `version: 1`; saved settings without the new fields get the defaults, and a field with an invalid value falls back to its default on its own). The layout applies to every lesson (built-in and course lessons); Free play and the Library keep today's piano and notation.
- **FR-10 Reset.** **Reset** must set keyboard height, octaves, staff size, note names, and the hint back to their defaults (M, Auto, M, off, off) at once. Tempo and metronome are not changed.

### Layout of the editor

- **FR-11** From 1024 px wide (and on a phone held sideways) the options panel sits to the right of the preview, as on the canvas, and scrolls on its own if it does not fit. On narrower screens the options come first in one column and the preview (staff, handle, piano) below. Nothing scrolls sideways at 360 px except the piano itself (FR-5). The piano of the preview is drawn exactly like a lesson's piano with the current settings.

## Non-functional requirements

- User-facing text goes through the translations module (English first; `uk`, `de`, `fr` too). The size letters S / M / L / XL are shown as they are in every language, with a translated accessible name (small, medium, large, extra large).
- Works with the on-screen and computer keyboard (no MIDI device required); every control is reachable and operable by keyboard with visible focus rings; segmented controls report `aria-pressed`, switches use `role="switch"` with `aria-checked`; touch targets ≥ 44 px.
- Pure rules (settings parsing, the size tables, the fixed-octave range, the snapping of a dragged height, the example's steps) live in `src/core/` with unit tests and no React, DOM, audio, storage, or timers.
- Colours only from theme tokens; no new runtime dependencies.
- No change to judging, scoring, saved progress, or lesson content. No perceptible added input latency.

## Out of scope

- A layout button in the lesson header or a layout panel over a running lesson (the canvas's header button; user decision: Settings only).
- Sound in the example, or a choice of example.
- Applying the layout to Free play or the Library (their piano and notation stay as they are).
- Free (non-snapping) keyboard heights, per-lesson or per-device layouts, a layout per orientation.
- Hiding the computer-keyboard letters; note names in another convention.

## Decisions

| Question                                         | Decision                                                                                                                                                                     | Reason                                                                                                                         |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Where does the editor open from?                 | **Settings only**: a "Lesson layout" section with "Edit layout"; Back and Done return to Settings.                                                                           | User choice. Keeps the crowded lesson header (Phase 20) as it is.                                                              |
| What plays in the editor?                        | A **silent built-in loop**: cursor, lit keys, and the hint ring move; no sound.                                                                                              | User choice (recommended). The learner can adjust in peace; no audio timing to manage.                                         |
| How do "octaves on screen" work?                 | **Auto** (default, today's behaviour) or **2 / 3 / 4** around the lesson's notes; white keys stay ≥ 40 px; if the lesson needs more, the piano scrolls and follows the step. | User choice (recommended). Nothing changes for current users; wide keys for those who want them.                               |
| Note names on keys                               | **Off by default**, as on the canvas: only C keys (and lit keys) are named until it is turned on. Computer-key letters unchanged.                                            | User choice. A cleaner piano by default; one switch brings the names back.                                                     |
| How does dragging the keyboard height work?      | It **snaps** to S / M / L / XL while dragging; the handle is also a keyboard slider.                                                                                         | Agent decision (review): one saved value per size keeps the segmented control, short-screen sizes, and tests simple.           |
| What are the sizes?                              | Keyboard 140 / **176** / 216 / 256 px (short screen 96 / **112** / 128 / 144); staff ×0.8 / **1** / ×1.25. **M** is today's size.                                            | Agent decision (review): the defaults keep today's look; the short sizes keep header, staff, and piano on an 844 × 390 screen. |
| Do Reset and the editor touch tempo / metronome? | No: Reset covers the layout fields and the hint only.                                                                                                                        | The canvas's Reset is in the layout editor; tempo belongs to the lesson header.                                                |
