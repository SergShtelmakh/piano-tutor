# Plan — Browser Back and history

> Roadmap phase: Phase 23 — Browser Back and history
> Branch: `feature/browser-history`
> Status: Draft

## Goal

The phone's Back gesture and the browser's Back and Forward buttons move through Piano Tutor like an app (lesson → course → screen → Home → out) instead of leaving it. A reload stays on the same screen or course.

## Approach

**App state stays the source of truth; the history mirrors it.** `App.tsx` keeps `screen`, the course source, `lessonId`, and `layoutEditorOpen` as today. There is no router. A small history controller writes an entry when that state goes one level deeper, and turns a `popstate` back into app state.

**Two kinds of history entries.** Every entry's `history.state` is `{ app: 'piano-tutor', index, kind }`:

- **Route entries** carry a hash (FR-1): Home, a main screen, a course. They come from a `Route = { screen, course }` that the Shell derives from its state. Home is always index 0.
- **Layer entries** keep the hash of the route below them: the open lesson, the layout editor, the Add lesson sheet. They are never written to the hash, so a reload cannot reopen them (FR-5).

**Pure rules** in `src/core/route.ts` (no DOM, unit-tested):

- `Screen` moves here from `components/shell/screens.ts`, which re-exports it, because the core must not import from components.
- `parseHash(hash)` → `{ screen, course: string | null } | null` and `formatHash(route)`. Ids are encoded with `encodeURIComponent`.
- `routeEntries(route)` → the route levels: `[home]`, `[home, screen]`, `[home, screen?, course]`.
- `historySteps(from, to)` → `{ back: number; replace?: Entry; push: Entry[] }`. It keeps the common prefix and goes back to it. Where both stacks have an entry at the first differing index, it **replaces** that entry instead of popping and pushing it (Library → Settings is one `replaceState`, FR-2). Then it pushes the rest.

**The adapter** `src/navigation/history.ts` wraps a `HistoryLike` (`state`, `length`, `pushState`, `replaceState`, `go`, plus a `popstate` subscription). It is injectable, so the tests use a fake history. It holds the current stack and the active layers:

- `syncRoute(route)`: called by the Shell whenever the derived route changes. It applies `historySteps`. `go(-n)` is asynchronous, so the controller counts the `popstate` events it caused itself and ignores them, and runs the replace / push once they have arrived.
- `useBackLayer(active, onBack)`: a hook. While `active` is true, the layer has an entry on top. Closing it in the app (its own Back, Escape, a button) pops that entry (FR-2, FR-4). On a Back from outside, the top layer's `onBack` runs. It returns `'leave'` (the entry stays gone) or `'stay'` (the controller pushes the entry again).
- **`popstate`:** the new index is read from `history.state`. Lower than the stack: pop the layers above it (the top one decides, as above), or tell the Shell the route of the target entry. Higher (Forward, FR-6): a route entry is applied. A layer entry is undone with `go(-1)`, so it never reopens. An entry without our state (typed by hand, or `hashchange` alone) is treated like a start with that hash, using `replaceState`.
- **Start (FR-5):** if the current entry already has our state and is a route entry (a reload), its stack is kept and its hash applied. If it is a layer entry, the controller goes back to the route entry below it. Otherwise (a fresh visit or a link), the stack is built from the hash: `replaceState(home)`, then `pushState` for the screen and the course, so Back from a link to `#/library` lands on Home.

**Wiring:**

- `App.tsx` derives the route from `screen` and `course.source` (the course id is the piece id or `file-<hash>`). It calls `syncRoute`, and applies the routes that come back from `popstate` with the existing `navigate`, `closeCourse`, and course openers. On start, a course id is resolved against `LIBRARY_PIECES` and the My lessons entries (kept files). Anything else drops the course and corrects the hash. The in-app Back buttons keep calling their state setters, and the controller sees the shallower route and pops the extra entries, so they need no change beyond what the layers need.
- `LessonScreen`: `useBackLayer(true, …)`. Running → `pause()` and `'stay'` (FR-3). Paused or finished → `onExit()` and `'leave'`. Its own Back button and the pause dialog's Exit pop the layer as usual. Escape on the pause dialog still resumes.
- `LayoutEditorScreen`: `useBackLayer(true, onExit)`.
- `LessonsScreen`: `useBackLayer(sheetOpen, () => setSheetOpen(false))` for the Add lesson sheet.

Leaving by Back unmounts the same components as leaving in the app does, so FR-7 (playback stops, notes are released, nothing is recorded) comes from the existing cleanup.

## Task groups

1. **Route rules (pure)**
   - [ ] `src/core/route.ts`: `Screen`, `Route`, `parseHash`, `formatHash`, `routeEntries`, `historySteps`. Re-export `Screen` from `components/shell/screens.ts`.
   - [ ] `src/core/route.test.ts`: every main screen and course hash both ways, `#`, `#/`, and no hash as Home, unknown screen / extra segments / bad encoding as `null`, ids with special characters, and `historySteps` for push, replace between main screens, back from a course to Home, a course to another screen (back 1 + replace), and no change.
2. **History controller**
   - [ ] `src/navigation/history.ts`: the `HistoryLike` type, the controller (stack, layers, `syncRoute`, `popstate`, the start), and a default instance on `window.history`.
   - [ ] `src/navigation/useBackLayer.ts` and `useHistoryRoute.ts` (the hooks the components use).
   - [ ] `src/navigation/history.test.ts` with a fake history: a fresh start at `#/library` builds `[home, library]`, a reload on a route entry keeps the stack, a reload on a layer goes back, Back from a layer calls `onBack` (`'stay'` pushes again), closing a layer in the app pops it, Forward into a layer is undone, own `go` events are ignored, and a foreign entry is replaced.
3. **Screens and courses**
   - [ ] `App.tsx`: derive the route, `syncRoute`, apply routes from `popstate`, resolve a course id at start (library piece, kept file, else the screen).
   - [ ] Check that the in-app Back of the header, the course, and Open in player leave the expected stack (FR-2).
4. **Layers**
   - [ ] `LessonScreen`: the lesson layer with pause-first (FR-3).
   - [ ] `LayoutEditorScreen`: the editor layer.
   - [ ] `LessonsScreen`: the Add lesson sheet as a layer (FR-4).
5. **Checks**
   - [ ] `bun run lint`, `format:check`, `build`, `test`.
   - [ ] A headless-Chrome script (not in the repo) on `bun run preview`, also with `BASE_PATH=/piano-tutor/`: walk the FR-2 to FR-6 flows with `history.back()` / `forward()` / reload, and assert the screen and `location.hash` after each step. Check the console for errors.

## Files touched

| File                                                   | Change                                          |
| ------------------------------------------------------ | ----------------------------------------------- |
| `src/core/route.ts` (+ test)                           | New: hash parsing and formatting, history steps |
| `src/components/shell/screens.ts`                      | Re-export `Screen` from the core                |
| `src/navigation/history.ts` (+ test)                   | New: the history controller                     |
| `src/navigation/useBackLayer.ts`, `useHistoryRoute.ts` | New: hooks                                      |
| `src/App.tsx`                                          | Route sync, start, routes from `popstate`       |
| `src/components/LessonScreen.tsx`                      | Lesson layer, pause-first                       |
| `src/components/LayoutEditorScreen.tsx`                | Editor layer                                    |
| `src/components/LessonsScreen.tsx`                     | Add lesson sheet layer                          |

## New dependencies

None. A router library (React Router, TanStack Router, wouter) is not needed: there are five screens and one nested level, and app state already decides what is shown. A router would also have to share control with the layers and the pause-first rule.

## Risks & open questions

- **Asynchronous `history.go`.** Several quick changes (for example Continue opening a course and then a lesson in the same tick) can arrive while a `go(-n)` is still pending. The controller queues the steps and applies them after its own `popstate` events. The tests cover a push during a pending back.
- **React StrictMode** mounts effects twice in dev. A layer that pops on unmount and pushes on mount would go back and forward. The controller defers a layer's pop to a microtask and cancels it if the same layer registers again.
- **Entries from an older build.** History entries without our `app` marker (from before this phase, or from another page) are treated as foreign: they are replaced, never trusted.
- **Leaving the app.** Whether Back on Home closes the installed app or goes to the previous site depends on the browser. The app does not try to change it.
- **Forward into a layer** is undone with `go(-1)`. That can show a short flicker of the screen below. It is acceptable for a rare action.
- Calling `history.pushState` is not a page load, so the service worker and both hosts need no change. The PWA `start_url` (no hash) opens Home.
