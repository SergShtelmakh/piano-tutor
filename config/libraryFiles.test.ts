// Checks the catalogue against the real files in public/library. It lives in `config/` because it
// reads the disk (that project has the Node types); the rules about the data are in
// `src/core/library.test.ts`.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { pieceFile } from '../src/core/library.ts';
import { LIBRARY_COMPOSERS, LIBRARY_PIECES } from '../src/core/libraryCatalog.ts';
import { parseMidiFile } from '../src/core/smf.ts';

const ROOT = new URL('../public/library/', import.meta.url).pathname.replace(
  /^\/([A-Za-z]:)/,
  '$1',
);
const MAX_FILE_BYTES = 150 * 1024;
const MAX_TOTAL_BYTES = 3 * 1024 * 1024;
const MAX_PORTRAIT_BYTES = 40 * 1024;

function filesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? filesUnder(join(dir, entry.name)) : [join(dir, entry.name)],
  );
}

const onDisk = filesUnder(ROOT).map((file) => relative(ROOT, file).replace(/\\/g, '/'));

describe('library files', () => {
  it('has a file for every catalogue entry, and every file is in the catalogue', () => {
    const listed = LIBRARY_PIECES.map(pieceFile).sort();
    expect(onDisk.filter((file) => file.endsWith('.mid')).sort()).toEqual(listed);
  });

  it('holds nothing but .mid files and the portraits', () => {
    const portraits = LIBRARY_COMPOSERS.map((composer) => composer.portrait.file).sort();
    expect(onDisk.filter((file) => !file.endsWith('.mid')).sort()).toEqual(portraits);
  });

  it('keeps each composer in a folder named after its id, next to the portraits folder', () => {
    const folders = new Set(onDisk.map((file) => file.split('/')[0]));
    const expected = [...LIBRARY_COMPOSERS.map((composer) => composer.id), 'portraits'];
    expect([...folders].sort()).toEqual(expected.sort());
  });

  it('has a small real JPEG for every portrait', () => {
    for (const composer of LIBRARY_COMPOSERS) {
      const bytes = readFileSync(join(ROOT, composer.portrait.file));
      expect(bytes.length, composer.id).toBeLessThanOrEqual(MAX_PORTRAIT_BYTES);
      expect([...bytes.subarray(0, 3)], composer.id).toEqual([0xff, 0xd8, 0xff]); // JPEG header
    }
  });

  it('keeps every file small, and the whole library under 3 MB', () => {
    let total = 0;
    for (const piece of LIBRARY_PIECES) {
      const size = statSync(join(ROOT, pieceFile(piece))).size;
      expect(size, piece.id).toBeLessThanOrEqual(MAX_FILE_BYTES);
      total += size;
    }
    expect(total).toBeLessThanOrEqual(MAX_TOTAL_BYTES);
  });

  it('parses every file with the Player parser, and the duration matches the catalogue', () => {
    for (const piece of LIBRARY_PIECES) {
      const result = parseMidiFile(new Uint8Array(readFileSync(join(ROOT, pieceFile(piece)))));
      expect(result.ok, `${piece.id}: ${result.ok ? '' : result.error}`).toBe(true);
      if (!result.ok) continue;
      expect(result.piece.notes.length, piece.id).toBeGreaterThan(0);
      expect(Math.abs(result.piece.duration - piece.duration), piece.id).toBeLessThanOrEqual(2);
    }
  });
});
