import { HOME, historySteps, parseHash, routeKeys, sameRoute, type Route } from '../core/route.ts';

/** What a layer answers to Back: it was left (the entry stays gone), or it stays (push it again). */
export type LayerResult = 'leave' | 'stay';

/** The parts of `window` the controller uses, so a test can supply a fake. */
export interface HistoryHost {
  state(): unknown;
  hash(): string;
  pushState(state: unknown, hash: string): void;
  replaceState(state: unknown, hash: string): void;
  go(delta: number): void;
  /** Calls `listener` on every `popstate`. */
  listen(listener: () => void): void;
}

const MARK = 'piano-tutor';
const LAYER = 'layer:';

interface EntryState {
  app: typeof MARK;
  index: number;
  key: string;
}

function readState(value: unknown): EntryState | null {
  if (typeof value !== 'object' || value === null) return null;
  const { app, index, key } = value as Record<string, unknown>;
  if (app !== MARK || typeof index !== 'number' || typeof key !== 'string') return null;
  return { app, index, key };
}

const isLayerKey = (key: string) => key.startsWith(LAYER);

/**
 * Keeps the browser history in step with the app. The app's state stays the source of truth: the
 * controller is told the route and the open layers, and makes the history match them.
 *
 * The history is a stack of entries, each with a key. A route entry's key is its hash (Home, a
 * main screen, a course); a layer entry (the open lesson, the layout editor, a sheet) keeps the
 * hash of the route below it and is never read back from the address. Back that leaves a layer
 * asks the layer first (`LayerResult`).
 */
export function createHistory(host: HistoryHost) {
  let stack: string[] = [];
  let route: Route = HOME;
  let initial: Route | null = null;
  let routeListener: ((route: Route) => void) | null = null;
  const layers = new Map<string, () => LayerResult>();
  // True while a `go` of the controller's own is on its way: its `popstate` is not the learner's.
  let waiting = false;
  let scheduled = false;

  const wanted = () => [...routeKeys(route), ...[...layers.keys()].map((name) => LAYER + name)];

  /** The hash shown for the entry at `index`: the nearest route entry at or below it. */
  const hashAt = (keys: readonly string[], index: number) => {
    for (let i = index; i >= 0; i--) if (!isLayerKey(keys[i])) return keys[i];
    return '#/';
  };
  const stateAt = (index: number, key: string): EntryState => ({ app: MARK, index, key });

  function push(key: string) {
    stack.push(key);
    host.pushState(stateAt(stack.length - 1, key), hashAt(stack, stack.length - 1));
  }

  function replaceTop(key: string) {
    stack[stack.length - 1] = key;
    host.replaceState(stateAt(stack.length - 1, key), hashAt(stack, stack.length - 1));
  }

  /** Turns the history into the wanted stack. After a `go` it resumes on the `popstate`. */
  function reconcile() {
    if (waiting) return;
    const steps = historySteps(stack, wanted());
    if (steps.back > 0) {
      waiting = true;
      stack = stack.slice(0, stack.length - steps.back);
      host.go(-steps.back);
      return;
    }
    if (steps.replace !== null) replaceTop(steps.replace);
    for (const key of steps.push) push(key);
  }

  /** Reconciles after the current batch of changes, so a burst of them is one step. */
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      reconcile();
    });
  }

  function announce(next: Route) {
    route = next;
    routeListener?.(next);
  }

  /** Builds the stack for `target` on the current entry (a visit, a link, or a foreign entry). */
  function build(target: Route) {
    const keys = routeKeys(target);
    stack = [];
    host.replaceState(stateAt(0, keys[0]), keys[0]);
    stack.push(keys[0]);
    for (const key of keys.slice(1)) push(key);
  }

  /** An entry the controller did not make: start again from its address. */
  function rebuild() {
    for (const name of [...layers.keys()].reverse()) layers.get(name)?.();
    layers.clear();
    const target = parseHash(host.hash()) ?? HOME;
    build(target);
    announce(target);
  }

  function onPopState() {
    if (waiting) {
      waiting = false;
      reconcile();
      return;
    }
    const state = readState(host.state());
    const top = stack.length - 1;
    if (!state) return rebuild();
    if (state.index === top) {
      if (stack[top] !== state.key) rebuild();
      return;
    }

    if (state.index < top) {
      if (stack[state.index] !== state.key) return rebuild();
      const removed = stack.slice(state.index + 1);
      stack = stack.slice(0, state.index + 1);
      let stayed = false;
      for (const key of removed.reverse()) {
        if (!isLayerKey(key)) continue;
        const name = key.slice(LAYER.length);
        const answer = layers.get(name)?.();
        if (answer === 'stay') {
          stayed = true;
          break;
        }
        layers.delete(name);
      }
      if (!stayed && removed.some((key) => !isLayerKey(key))) {
        // The route is the last route entry that is left.
        const left = parseHash(hashAt(stack, stack.length - 1));
        if (left) announce(left);
      }
      reconcile();
      return;
    }

    // Forward. A layer is never reopened; a route entry is, when it is the next level of the tree.
    if (state.index === top + 1) {
      if (isLayerKey(state.key)) {
        waiting = true;
        host.go(-1);
        return;
      }
      const next = parseHash(state.key);
      if (next && routeKeys(next).join('\n') === [...stack, state.key].join('\n')) {
        stack.push(state.key);
        announce(next);
        reconcile();
        return;
      }
    }
    rebuild();
  }

  return {
    /**
     * Reads the address once, before the first render, and returns where the app starts. A reload
     * keeps the entries below; a fresh visit or a link gets Home below it. Calling it again is safe.
     */
    start(): Route {
      if (initial) return initial;
      host.listen(onPopState);
      const state = readState(host.state());
      const parsed = parseHash(host.hash());
      if (state && parsed && !isLayerKey(state.key)) {
        const keys = routeKeys(parsed);
        if (keys[keys.length - 1] === state.key && keys.length - 1 === state.index) {
          stack = keys;
          route = parsed;
          initial = parsed;
          return parsed;
        }
      }
      route = parsed ?? HOME;
      build(route);
      initial = route;
      return route;
    },

    /** The app's route changed (or was corrected): make the history match. */
    setRoute(next: Route) {
      if (sameRoute(route, next)) return;
      route = next;
      schedule();
    },

    /** The listener applies a route that came from Back or Forward to the app's state. */
    onRoute(listener: (route: Route) => void) {
      routeListener = listener;
      return () => {
        if (routeListener === listener) routeListener = null;
      };
    },

    /** A layer is open while registered; returns the function that closes it. */
    addLayer(name: string, onBack: () => LayerResult) {
      layers.set(name, onBack);
      schedule();
      return () => {
        if (layers.get(name) !== onBack) return;
        layers.delete(name);
        schedule();
      };
    },
  };
}

export type AppHistory = ReturnType<typeof createHistory>;

/** The history of the page. */
export const appHistory = createHistory({
  state: () => window.history.state,
  hash: () => window.location.hash,
  pushState: (state, hash) => window.history.pushState(state, '', hash),
  replaceState: (state, hash) => window.history.replaceState(state, '', hash),
  go: (delta) => window.history.go(delta),
  listen: (listener) => window.addEventListener('popstate', listener),
});
