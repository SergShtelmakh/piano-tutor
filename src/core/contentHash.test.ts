import { describe, expect, it } from 'vitest';
import { contentHash } from './contentHash.ts';

describe('contentHash', () => {
  it('matches known FNV-1a values', () => {
    expect(contentHash(new Uint8Array())).toBe('811c9dc5');
    expect(contentHash(new TextEncoder().encode('a'))).toBe('e40c292c');
    expect(contentHash(new TextEncoder().encode('foobar'))).toBe('bf9cf968');
  });

  it('differs for different bytes and repeats for the same bytes', () => {
    const a = Uint8Array.from([1, 2, 3]);
    expect(contentHash(a)).toBe(contentHash(Uint8Array.from([1, 2, 3])));
    expect(contentHash(a)).not.toBe(contentHash(Uint8Array.from([1, 2, 4])));
  });
});
