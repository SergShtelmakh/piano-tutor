import { describe, expect, it } from 'vitest';
import { formatHash, historySteps, HOME, parseHash, routeEntries, routeKeys } from './route.ts';

describe('formatHash / parseHash', () => {
  it('writes and reads every main screen', () => {
    expect(formatHash(HOME)).toBe('#/');
    for (const screen of ['lessons', 'library', 'free', 'settings'] as const) {
      const route = { screen, course: null };
      expect(formatHash(route)).toBe(`#/${screen}`);
      expect(parseHash(`#/${screen}`)).toEqual(route);
    }
  });

  it('reads Home from no hash, #, and #/', () => {
    expect(parseHash('')).toEqual(HOME);
    expect(parseHash('#')).toEqual(HOME);
    expect(parseHash('#/')).toEqual(HOME);
  });

  it('writes and reads a course above a screen and above Home', () => {
    const above = { screen: 'library', course: 'bach-prelude' } as const;
    expect(formatHash(above)).toBe('#/library/course/bach-prelude');
    expect(parseHash('#/library/course/bach-prelude')).toEqual(above);
    const home = { screen: 'home', course: 'file-1a2b' } as const;
    expect(formatHash(home)).toBe('#/course/file-1a2b');
    expect(parseHash('#/course/file-1a2b')).toEqual(home);
  });

  it('encodes ids with special characters', () => {
    const route = { screen: 'lessons', course: 'a/b c#d' } as const;
    expect(formatHash(route)).toBe('#/lessons/course/a%2Fb%20c%23d');
    expect(parseHash(formatHash(route))).toEqual(route);
  });

  it('accepts a trailing slash', () => {
    expect(parseHash('#/library/')).toEqual({ screen: 'library', course: null });
  });

  it('rejects anything else', () => {
    for (const hash of [
      '#nothing',
      '#/nothing',
      '#/home',
      '#/library/other',
      '#/library/course',
      '#/library/course/',
      '#/library/course/a/b',
      '#/course',
      '#/course/%E0%A4%A',
      '#/library/course/x/extra',
    ]) {
      expect(parseHash(hash), hash).toBeNull();
    }
  });
});

describe('routeEntries / routeKeys', () => {
  it('has Home alone for Home', () => {
    expect(routeKeys(HOME)).toEqual(['#/']);
  });

  it('puts a main screen one level below Home', () => {
    expect(routeKeys({ screen: 'settings', course: null })).toEqual(['#/', '#/settings']);
  });

  it('adds the course level, with or without a screen below it', () => {
    expect(routeKeys({ screen: 'library', course: 'x' })).toEqual([
      '#/',
      '#/library',
      '#/library/course/x',
    ]);
    expect(routeEntries({ screen: 'home', course: 'x' })).toHaveLength(2);
    expect(routeKeys({ screen: 'home', course: 'x' })).toEqual(['#/', '#/course/x']);
  });
});

describe('historySteps', () => {
  const home = '#/';
  it('does nothing for equal stacks', () => {
    expect(historySteps([home, '#/free'], [home, '#/free'])).toEqual({
      back: 0,
      replace: null,
      push: [],
    });
  });

  it('pushes a deeper level', () => {
    expect(historySteps([home], [home, '#/library'])).toEqual({
      back: 0,
      replace: null,
      push: ['#/library'],
    });
  });

  it('replaces one main screen with another instead of stacking', () => {
    expect(historySteps([home, '#/library'], [home, '#/settings'])).toEqual({
      back: 0,
      replace: '#/settings',
      push: [],
    });
  });

  it('goes back from a screen to Home', () => {
    expect(historySteps([home, '#/library'], [home])).toEqual({
      back: 1,
      replace: null,
      push: [],
    });
  });

  it('goes back from a course to another screen with a replace', () => {
    expect(historySteps([home, '#/lessons', '#/lessons/course/x'], [home, '#/library'])).toEqual({
      back: 1,
      replace: '#/library',
      push: [],
    });
  });

  it('replaces and pushes for a different screen with a course', () => {
    expect(historySteps([home, '#/lessons'], [home, '#/library', '#/library/course/x'])).toEqual({
      back: 0,
      replace: '#/library',
      push: ['#/library/course/x'],
    });
  });

  it('goes back through layers', () => {
    expect(historySteps([home, '#/lessons', 'layer:sheet'], [home, '#/lessons'])).toEqual({
      back: 1,
      replace: null,
      push: [],
    });
  });
});
