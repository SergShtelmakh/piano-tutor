# Responsive on-screen keyboard

> **Done in Phase 8** (see `specs/phase-08-responsive-keyboard/`). Decisions: the computer-keyboard range stays in the middle and whole octaves are added around it; 40 px minimum white key; horizontal scroll on an octave ruler for narrow screens. The "real keyboard size" cap became Phase 9 (`keyboard-size.md`). Left open: zoom or a key-width setting, a landscape hint.

## Problem

The on-screen piano doesn't adapt to the window. On a narrow phone the keys are too thin to hit reliably; on a wide monitor space is wasted. A lesson's target note can also end up outside the visible keys.

## Idea

Measure the keyboard container and choose how many keys to show from its width:

- Keep the white-key width inside a comfortable range (about 36–64 px, at least 40–44 px for touch), and show as many white keys as fit. A phone in portrait shows 1–2 octaves, a laptop 4–5, a wide monitor all 88.
- Cap the range at what is useful: the lesson's notes, and the real keyboard size (see [`keyboard-size.md`](keyboard-size.md)). If the visible range is smaller than the cap, stretch the keys to fill the full width.
- When the lesson range doesn't fit, offer octave up / down buttons or horizontal scroll.

## Rough approach

- Pure core: a function `(width, key limits, lesson range) → visible key range`, with no React / DOM imports and unit tests.
- A thin hook around `ResizeObserver` on the keyboard container (it also reacts to phone rotation, unlike `window.resize`) feeds the width into that function.
- The piano component only renders the range it is given; the staff and the keyboard use the same range so the target note is always visible.

## Open questions

- Centre the range on the lesson notes, on middle C, or keep it where the user scrolled?
- Min / max key widths: tune on real devices (phone, tablet, desktop).
- Landscape-only hint on small phones, or just show fewer octaves?
