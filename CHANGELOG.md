# Changelog

All notable changes to this project are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## 2026-10-25 — Phase 3: online on two hosts

### Added

- The app is deployed over HTTPS, so Web MIDI works on any device. GitHub Pages: https://sergshtelmakh.github.io/piano-tutor/ (goes live after this release is merged). Cloudflare: https://piano-tutor.sh-serg1993.workers.dev/, with a preview link for every branch.
- A small footer shows which build you are running (commit and host), in all four languages.

### Changed

- MIDI keyboards were tested on real devices with a Roland FP-30X: connect, velocity, plugging in and out, and the sustain pedal work in desktop Chrome and in Android Chrome over USB-OTG.

### Known issues

- The two hosts are not compared yet; one may be dropped later.

## 2026-10-25 — Phase 2: play the piano

### Added

- The start screen is now a free-play piano. Every key press makes a sound and lights up the key on screen.
- Play with the computer keyboard: `A S D F G H J K L ;` are the white keys, `W E T Y U O P` the black keys, and `Z` / `X` shift the octave. Keys follow their physical position, so QWERTZ and AZERTY keyboards work too, and in Chrome the key labels match your layout.
- Play the on-screen piano with a mouse, pen, or several fingers at once. The octave buttons move the two-octave range (C3–C5 by default).
- Connect a MIDI keyboard in Chrome or Edge with **Connect MIDI keyboard**. All connected keyboards work, including velocity and the sustain pedal. Plugging in or out is picked up without a reload. Clear messages explain when MIDI is blocked, unsupported, or needs a secure page.
- Note names follow your language: C D E… in English, C D E… H in German, до ре мі… in Ukrainian, do ré mi… in French.
- Volume slider and mute button; both are remembered.

### Known issues

- Connecting a real MIDI keyboard has not been tested on a device yet. The on-screen piano and computer keyboard were tested.

### Removed

- The "coming soon" placeholder message.

## 2026-10-25 — Phase 1: project scaffold

### Added

- The app opens a placeholder start screen at `http://localhost:3000` (`bun run dev`).
- The interface is available in English, Ukrainian, German, and French. On the first visit it follows the browser language and falls back to English. The language selector switches languages instantly and remembers your choice. If browser storage is blocked, switching still works for the current session.
- For developers: type check, ESLint, Prettier, unit tests, and a GitHub Actions CI that runs them on every pull request.
