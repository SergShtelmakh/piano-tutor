import { describe, expect, it } from 'vitest';
import { findScoreEntry, readZip, rootfilePath } from './zip.ts';
import { makeZip, utf8 } from './zipTestHelpers.ts';

const container = (path: string) =>
  `<?xml version="1.0"?><container><rootfiles><rootfile full-path="${path}" media-type="x"/></rootfiles></container>`;

describe('readZip', () => {
  it('lists stored entries with their data', () => {
    const entries = readZip(
      makeZip([
        { name: 'a.txt', data: utf8('hello') },
        { name: 'dir/b.txt', data: utf8('world!') },
      ]),
    )!;
    expect(entries.map((e) => e.name)).toEqual(['a.txt', 'dir/b.txt']);
    expect(new TextDecoder().decode(entries[1].data)).toBe('world!');
    expect(entries[0]).toMatchObject({ method: 0, encrypted: false, compressedSize: 5 });
  });

  it('reports the method, the encrypted flag, and the declared size', () => {
    const [entry] = readZip(
      makeZip([{ name: 'x', data: utf8('zz'), method: 8, flags: 1, uncompressedSize: 99 }]),
    )!;
    expect(entry).toMatchObject({ method: 8, encrypted: true, uncompressedSize: 99 });
  });

  it('returns null for non-zip, empty, and truncated input', () => {
    expect(readZip(new Uint8Array())).toBeNull();
    expect(readZip(utf8('this is not a zip file at all'))).toBeNull();
    const zip = makeZip([{ name: 'a', data: utf8('hello') }]);
    expect(readZip(zip.subarray(0, zip.length - 10))).toBeNull();
  });

  it('returns null when an entry points outside the file', () => {
    const zip = makeZip([{ name: 'a', data: utf8('hello') }]);
    // Corrupt the local header offset in the central directory (46 bytes in, at +42).
    const view = new DataView(zip.buffer);
    const central = zip.length - 22 - (46 + 1);
    view.setUint32(central + 42, 0xfffffff0, true);
    expect(readZip(zip)).toBeNull();
  });
});

describe('findScoreEntry', () => {
  const entries = readZip(
    makeZip([
      { name: 'META-INF/container.xml', data: utf8('') },
      { name: 'other.xml', data: utf8('') },
      { name: 'score.musicxml', data: utf8('') },
    ]),
  )!;

  it('follows container.xml', () => {
    expect(findScoreEntry(entries, container('score.musicxml'))?.name).toBe('score.musicxml');
    expect(findScoreEntry(entries, container('other.xml'))?.name).toBe('other.xml');
  });

  it('falls back to the first xml entry outside META-INF', () => {
    expect(findScoreEntry(entries, null)?.name).toBe('other.xml');
    expect(findScoreEntry(entries, container('missing.xml'))?.name).toBe('other.xml');
    expect(findScoreEntry(entries, 'not xml')?.name).toBe('other.xml');
  });

  it('finds nothing when there is no score entry', () => {
    const none = readZip(makeZip([{ name: 'readme.txt', data: utf8('') }]))!;
    expect(findScoreEntry(none, null)).toBeUndefined();
  });

  it('reads the first rootfile path', () => {
    expect(rootfilePath(container('a/b.xml'))).toBe('a/b.xml');
    expect(rootfilePath('<container/>')).toBeUndefined();
  });
});
