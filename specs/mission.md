# Mission

> Part of the project **constitution** (`mission.md` · `tech-stack.md` · `roadmap.md`).
> This file answers **why** and **for whom**. Change it rarely and deliberately.
> Status: **initial draft** — review it, it is the foundation for everything else.

## Vision

Piano Tutor is a gamified piano-learning web app. You connect your digital piano or MIDI keyboard through Web MIDI, and the app checks in real time whether you play the right notes — turning practice into short, rewarding challenges instead of a chore.

## Audience

- **Primary:** beginner and early-intermediate learners who own a MIDI keyboard / digital piano and want motivating, structured practice without a human teacher.
- **Secondary:** learners without a MIDI device who start with the on-screen or computer keyboard.
- **Not targeted (for now):** professional musicians, music teachers managing students.

## Problems we solve

1. Self-taught learners can't tell whether they played the right notes — the app gives instant, per-note feedback.
2. Practice is boring and easy to abandon — game mechanics (progress, streaks, levels, rewards) keep learners coming back.
3. Getting started is hard — no account, no install, no cables beyond USB: open the page and play.

## Product principles (non-negotiables)

1. **Instant feedback:** a key press is judged and shown immediately; latency must be imperceptible.
2. **Fun first:** every feature is judged by whether it makes practice more engaging, not just more feature-rich.
3. **Zero friction:** runs in the browser, no sign-up required to start playing.
4. **Works without hardware:** every lesson is playable with the on-screen or computer keyboard.
5. **Privacy by default:** playing and progress data stay on the device unless the user explicitly opts in to something else.
6. **Honest scope:** small, finished features beat many half-built ones.

## Scope

**In scope (MVP direction):** Web MIDI input; real-time note checking; guided lessons and challenges; game mechanics (XP, streaks, levels); local progress; installable PWA.

**Out of scope (for now):** accounts and cloud sync; microphone pitch detection; teacher/classroom features; payments; AI-generated lessons.

## Success looks like

- A new learner connects a keyboard and completes their first lesson in under two minutes.
- A learner returns on following days because of their streak/progress.
- Note checking is correct and feels instant on a mid-range laptop and on Android Chrome.
