# Validation — MIDI file playback

The feature is done (and the branch can be merged) only when every box is checked.

## Automated

- [x] `bun run lint` passes
- [x] `bun run format:check` passes
- [x] `bun run build` passes
- [x] `bun run test` passes. New pure logic has unit tests: the parser (formats, running status, tempo, time signatures, percussion, pairing, every error), the playback schedule, the notation reduction (values, ties, rests, accidentals, bars), the system layout and cursor map, `spellNote`, and `shownRange` with `include`
- [x] CI is green on the PR

## Manual checks

Run `bun run dev` and open http://localhost:3000 in Chrome. You need a few `.mid` files:

- a simple one-hand melody;
- a two-hand piano piece (public domain, e.g. a Bach prelude or a Chopin prelude) with black keys;
- a file with a tempo change and one with a time-signature change (3/4 or 6/8);
- a format-0 file (single track);
- a `.txt` file renamed to `.mid`, and an empty `.mid` file (0 bytes).

- [x] FR-1: The mode switch shows Home, Free play, and Player. Player with no file shows the hint and the Open button, and the piano.
- [x] FR-2: **Open MIDI file** opens the file chooser filtered to `.mid` / `.midi`. Choosing a file shows its name and the score. Choosing a second file replaces the first (playback stops). Cancelling the chooser changes nothing. In DevTools → Network, opening a file makes no request.
- [x] FR-3: The two-hand piece, the format-0 file, and the file with drums (if you have one: no drum notes on the staff) open and play. Format-1 files with several tracks play all tracks together.
- [x] FR-4: The renamed `.txt` shows the "not a MIDI file" message, and the empty file shows the damaged or empty message. The previously loaded piece stays and still plays. (A file over 2 MB shows the "too large" message: make one by appending zeros.)
- [x] FR-5: In the score: black keys have ♯ before the notehead; a natural sign follows a sharp of the same note in the same bar; half and whole notes are open, shorter ones are filled with stems and flags; rests appear in gaps; bar lines and the time signature are shown; a note held over a bar line is tied; chords are stacked and seconds sit side by side. There is no key signature.
- [x] FR-6: The reduction is an approximation: the score of a two-hand piece is readable and its rhythm matches what you hear within a sixteenth note. Triplets look rounded, which is expected. Compare a few bars with the sound.
- [x] FR-7: The score shows two systems. When the cursor enters the second system, the view advances. At 360 px (device mode) a system holds fewer bars, is readable, and the page has no horizontal scrollbar.
- [x] FR-8: During playback the cursor moves smoothly, also through long notes and rests. Notes under the cursor are blue. Pausing keeps the cursor; Stop puts it at the start.
- [x] FR-9: In the DevTools accessibility pane the score is labelled with the file name and number of bars (correct plural in `uk`).
- [x] FR-10: Play starts the piece and the synth sounds with the file's dynamics and the pedal (a piece with pedal rings on). The tempo sounds right against a reference (play the same file in another player). A long piece (3+ minutes) doesn't drift away from the cursor. Pause and Stop silence everything at once. When the piece ends, playback stops, nothing keeps ringing, and the cursor returns to the start.
- [x] FR-11: Move the tempo slider to 50 % and 150 % during playback: the speed changes at once and the position is kept. At 100 % the speed is the file's.
- [x] FR-12: The position slider shows elapsed / total as `m:ss`. Dragging it while playing continues from the new place; dragging it while paused stays paused. Clicking a bar in the score jumps there. No notes stick after any seek.
- [x] FR-13: While a file plays, press keys on the computer keyboard and the on-screen piano (and a MIDI keyboard if available): they sound and light up. Playback doesn't stop. Pressing a key that playback also holds, then releasing it, doesn't cut the playback note.
- [x] FR-14: The keys of the sounding notes are blue on the piano. With a wide window the piano shows the piece's range (up to 88 keys). At 360 px the piano scrolls along to show the sounding notes. Holding a key with the mouse stops the scrolling until you let go.
- [x] FR-15: Switching to Home or Free play during playback stops it, with no stuck notes. Changing the language keeps the file and position.
- [x] FR-16: Switch to `uk`, `de`, `fr`: the mode label, buttons, labels, hint, and all five error messages are translated. **User skims the new translations.**
- [x] On a real Android phone (portrait and landscape): the Open button works (choosing a file from Downloads), playback is smooth, the score is readable, and the piano follows.
- [x] Works with a MIDI keyboard if one is available (optional).
- [x] No console errors.
- [x] User-facing text comes from the translations module, with keys in all locales (`en`, `uk`, `de`, `fr`).

## Constitution follow-up

- [x] `specs/roadmap.md`: Phase 9 status updated, with the outcome; the play-along idea and the notation leftovers (key signatures, flats, beams, tuplets, voices) are in the Backlog
- [x] `specs/tech-stack.md`: new `src/core/` modules and `src/playback/` in the project layout; the `'playback'` source; known debt (playback timing and the score view verified only manually)
- [x] `CHANGELOG.md` and `README.md` updated
