# Changelog

All notable changes to this project are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## 2026-10-25 — Phase 1: project scaffold

### Added

- The app opens a placeholder start screen at `http://localhost:3000` (`bun run dev`).
- The interface is available in English, Ukrainian, German, and French. On the first visit it follows the browser language and falls back to English. The language selector switches languages instantly and remembers your choice. If browser storage is blocked, switching still works for the current session.
- For developers: type check, ESLint, Prettier, unit tests, and a GitHub Actions CI that runs them on every pull request.
