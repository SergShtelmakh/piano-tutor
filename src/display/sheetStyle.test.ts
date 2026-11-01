import { afterEach, describe, expect, it, vi } from 'vitest';

const KEY = 'piano-tutor.sheetStyle';

function fakeStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    getItem: (k: string) => data[k] ?? null,
    setItem: (k: string, v: string) => {
      data[k] = v;
    },
    data,
  };
}

// The module reads storage when it loads, so each case loads a fresh copy.
async function load(storage: unknown) {
  vi.resetModules();
  vi.stubGlobal('localStorage', storage);
  return import('./sheetStyle.ts');
}

afterEach(() => vi.unstubAllGlobals());

describe('sheet style', () => {
  it('is paper when nothing is saved', async () => {
    const m = await load(fakeStorage());
    expect(m.getSheetStyle()).toBe('paper');
  });

  it('reads a saved dark style', async () => {
    const m = await load(fakeStorage({ [KEY]: 'dark' }));
    expect(m.getSheetStyle()).toBe('dark');
  });

  it('falls back to paper for an unknown value', async () => {
    const m = await load(fakeStorage({ [KEY]: 'blue' }));
    expect(m.getSheetStyle()).toBe('paper');
  });

  it('falls back to paper when storage throws, and still switches', async () => {
    const m = await load({
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    });
    expect(m.getSheetStyle()).toBe('paper');
    m.setSheetStyle('dark');
    expect(m.getSheetStyle()).toBe('dark');
  });

  it('saves a change and tells the listeners once', async () => {
    const storage = fakeStorage();
    const m = await load(storage);
    const listener = vi.fn();
    const off = m.subscribeSheetStyle(listener);
    m.setSheetStyle('dark');
    m.setSheetStyle('dark');
    expect(storage.data[KEY]).toBe('dark');
    expect(listener).toHaveBeenCalledTimes(1);
    off();
    m.setSheetStyle('paper');
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
