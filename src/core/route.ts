/** The main screens of the app. */
export type Screen = 'home' | 'lessons' | 'library' | 'free' | 'settings';

const SCREENS: readonly Screen[] = ['home', 'lessons', 'library', 'free', 'settings'];

/** Where the learner is: a main screen, and the course open above it (a piece or file id). */
export interface Route {
  screen: Screen;
  course: string | null;
}

export const HOME: Route = { screen: 'home', course: null };

export function sameRoute(a: Route, b: Route): boolean {
  return a.screen === b.screen && a.course === b.course;
}

/** `#/library`, `#/library/course/<id>`; Home is `#/` and a course above Home `#/course/<id>`. */
export function formatHash(route: Route): string {
  const base = route.screen === 'home' ? '#' : `#/${route.screen}`;
  if (route.course !== null) return `${base}/course/${encodeURIComponent(route.course)}`;
  return route.screen === 'home' ? '#/' : base;
}

/** The route of a hash; `''`, `#`, and `#/` are Home. `null` for anything not made by `formatHash`. */
export function parseHash(hash: string): Route | null {
  const path = hash.startsWith('#') ? hash.slice(1) : hash;
  if (path === '' || path === '/') return HOME;
  if (!path.startsWith('/')) return null;
  const parts = path.slice(1).split('/');
  if (parts[parts.length - 1] === '' && parts.length > 1) parts.pop();

  let screen: Screen = 'home';
  if (parts[0] !== 'course') {
    const named = SCREENS.find((item) => item === parts[0]);
    if (!named || named === 'home') return null;
    screen = named;
    parts.shift();
  }
  if (parts.length === 0) return { screen, course: null };
  if (parts.length !== 2 || parts[0] !== 'course') return null;
  try {
    const course = decodeURIComponent(parts[1]);
    return course === '' ? null : { screen, course };
  } catch {
    return null;
  }
}

/** The levels of the tree down to a route, Home first: each is one history entry. */
export function routeEntries(route: Route): Route[] {
  const entries: Route[] = [HOME];
  if (route.screen !== 'home') entries.push({ screen: route.screen, course: null });
  if (route.course !== null) entries.push(route);
  return entries;
}

/** The hashes of `routeEntries`: the keys of the route's history entries. */
export function routeKeys(route: Route): string[] {
  return routeEntries(route).map(formatHash);
}

export interface HistorySteps {
  /** Entries to go back through first. */
  back: number;
  /** A key that replaces the entry reached by going back, if any. */
  replace: string | null;
  /** Keys to push after that. */
  push: string[];
}

/**
 * What the browser history needs to turn the stack `from` into the stack `to` (both lists of entry
 * keys): keep the common start, then either push, go back, or, where both have an entry at the
 * first difference, replace that entry instead of stacking another.
 */
export function historySteps(from: readonly string[], to: readonly string[]): HistorySteps {
  let common = 0;
  while (common < from.length && common < to.length && from[common] === to[common]) common++;
  if (common === from.length) return { back: 0, replace: null, push: to.slice(common) };
  if (common === to.length) return { back: from.length - common, replace: null, push: [] };
  return { back: from.length - 1 - common, replace: to[common], push: to.slice(common + 1) };
}
