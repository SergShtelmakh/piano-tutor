import { describe, expect, it } from 'vitest';
import type { Route } from '../core/route.ts';
import { createHistory, type HistoryHost, type LayerResult } from './history.ts';

/** A browser history with an asynchronous `go`, like the real one. */
function fakeBrowser(startHash: string, startState: unknown = null) {
  const entries: { state: unknown; hash: string }[] = [
    { state: null, hash: '#/outside' },
    { state: startState, hash: startHash },
  ];
  let index = 1;
  let listener: (() => void) | null = null;
  const pending: number[] = [];
  const host: HistoryHost = {
    state: () => entries[index].state,
    hash: () => entries[index].hash,
    pushState(state, hash) {
      entries.splice(index + 1);
      entries.push({ state, hash });
      index++;
    },
    replaceState(state, hash) {
      entries[index] = { state, hash };
    },
    go: (delta) => void pending.push(delta),
    listen: (fn) => void (listener = fn),
  };
  return {
    host,
    hashes: () => entries.slice(0, index + 1).map((entry) => entry.hash),
    hash: () => entries[index].hash,
    /** The learner's Back / Forward button. */
    move(delta: number) {
      pending.push(delta);
      return this.settle();
    },
    /** Delivers the pending moves, as the browser does after a tick. */
    async settle() {
      await Promise.resolve();
      while (pending.length > 0) {
        index += pending.shift()!;
        listener?.();
        await Promise.resolve();
      }
    },
  };
}

function setup(hash = '', state: unknown = null) {
  const browser = fakeBrowser(hash, state);
  const history = createHistory(browser.host);
  const routes: Route[] = [];
  history.onRoute((route) => routes.push(route));
  return { browser, history, routes };
}

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('start', () => {
  it('puts Home below a link to a screen', async () => {
    const { browser, history } = setup('#/library');
    expect(history.start()).toEqual({ screen: 'library', course: null });
    expect(browser.hashes()).toEqual(['#/outside', '#/', '#/library']);
  });

  it('opens Home for no hash and for a bad one', () => {
    expect(setup('').history.start()).toEqual({ screen: 'home', course: null });
    const bad = setup('#/nothing');
    expect(bad.history.start()).toEqual({ screen: 'home', course: null });
    expect(bad.browser.hash()).toBe('#/');
  });

  it('is safe to call twice', () => {
    const { browser, history } = setup('#/library');
    history.start();
    history.start();
    expect(browser.hashes()).toHaveLength(3);
  });

  it('keeps the stack of a reload', () => {
    const state = { app: 'piano-tutor', index: 1, key: '#/library' };
    const { browser, history } = setup('#/library', state);
    history.start();
    expect(browser.hashes()).toEqual(['#/outside', '#/library']);
  });
});

describe('route changes', () => {
  it('pushes a deeper level and replaces a sibling screen', async () => {
    const { browser, history } = setup();
    history.start();
    history.setRoute({ screen: 'library', course: null });
    await flush();
    history.setRoute({ screen: 'settings', course: null });
    await flush();
    history.setRoute({ screen: 'free', course: null });
    await flush();
    expect(browser.hashes()).toEqual(['#/outside', '#/', '#/free']);
  });

  it('goes back to Home when the route does', async () => {
    const { browser, history, routes } = setup();
    history.start();
    history.setRoute({ screen: 'library', course: null });
    await flush();
    history.setRoute({ screen: 'home', course: null });
    await flush();
    await browser.settle();
    expect(browser.hashes()).toEqual(['#/outside', '#/']);
    expect(routes).toEqual([]); // the app's own change is not announced back
  });

  it('keeps going after a pending go', async () => {
    const { browser, history } = setup();
    history.start();
    history.setRoute({ screen: 'library', course: 'x' });
    await flush();
    history.setRoute({ screen: 'home', course: null });
    await flush();
    history.setRoute({ screen: 'settings', course: null }); // before the go is delivered
    await flush();
    await browser.settle();
    await flush();
    expect(browser.hashes()).toEqual(['#/outside', '#/', '#/settings']);
  });
});

describe('Back and Forward', () => {
  it('announces the route Back leads to', async () => {
    const { browser, history, routes } = setup();
    history.start();
    history.setRoute({ screen: 'library', course: 'x' });
    await flush();
    await browser.move(-1);
    expect(routes).toEqual([{ screen: 'library', course: null }]);
    await browser.move(-1);
    expect(routes[1]).toEqual({ screen: 'home', course: null });
  });

  it('reopens a route with Forward', async () => {
    const { browser, history, routes } = setup();
    history.start();
    history.setRoute({ screen: 'library', course: null });
    await flush();
    await browser.move(-1);
    await browser.move(1);
    expect(routes.at(-1)).toEqual({ screen: 'library', course: null });
    expect(browser.hash()).toBe('#/library');
  });

  it('treats an entry typed by hand as a new start', async () => {
    const { browser, history, routes } = setup();
    history.start();
    browser.host.pushState(null, '#/settings'); // a hash typed in the address bar
    await browser.move(0);
    expect(routes.at(-1)).toEqual({ screen: 'settings', course: null });
    expect(browser.hashes().slice(-2)).toEqual(['#/', '#/settings']);
  });
});

describe('layers', () => {
  function withLayer(answer: () => LayerResult) {
    const ctx = setup();
    ctx.history.start();
    ctx.history.setRoute({ screen: 'lessons', course: null });
    let closed = 0;
    const remove = ctx.history.addLayer('sheet', () => {
      closed++;
      return answer();
    });
    return { ...ctx, remove, closed: () => closed };
  }

  it('adds one entry and keeps the hash of the route', async () => {
    const { browser } = withLayer(() => 'leave');
    await flush();
    expect(browser.hashes()).toEqual(['#/outside', '#/', '#/lessons', '#/lessons']);
  });

  it('asks the layer on Back, and drops it when it leaves', async () => {
    const { browser, closed, routes } = withLayer(() => 'leave');
    await flush();
    await browser.move(-1);
    expect(closed()).toBe(1);
    expect(routes).toEqual([]);
    expect(browser.hashes()).toEqual(['#/outside', '#/', '#/lessons']);
  });

  it('pushes the layer again when it stays', async () => {
    const { browser, closed } = withLayer(() => 'stay');
    await flush();
    await browser.move(-1);
    await flush();
    expect(closed()).toBe(1);
    expect(browser.hashes()).toEqual(['#/outside', '#/', '#/lessons', '#/lessons']);
  });

  it('takes its entry away when it is closed in the app', async () => {
    const { browser, remove } = withLayer(() => 'leave');
    await flush();
    remove();
    await flush();
    await browser.settle();
    expect(browser.hashes()).toEqual(['#/outside', '#/', '#/lessons']);
  });

  it('never reopens a layer with Forward', async () => {
    const { browser, closed } = withLayer(() => 'leave');
    await flush();
    await browser.move(-1);
    // the layer is closed; the entry is still ahead in the browser's list
    browser.host.go(1);
    await browser.settle();
    await flush();
    await browser.settle();
    expect(browser.hash()).toBe('#/lessons');
    expect(browser.hashes()).toHaveLength(3);
    expect(closed()).toBe(1);
  });
});
