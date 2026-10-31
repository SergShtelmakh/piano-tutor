// Checks the piano samples against the real files in public/piano and their licence record. It
// lives in `config/` because it reads the disk (that project has the Node types); the sample rules
// are in `src/core/pianoSamples.test.ts`.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PIANO_SAMPLE_MAP } from '../src/core/pianoSampleMap.ts';
import { mapProblems } from '../src/core/pianoSamples.ts';

const fromRoot = (path: string) =>
  new URL(`../${path}`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SAMPLES = fromRoot('public/piano/');
const MAX_FILE_BYTES = 2 * 1024 * 1024; // Workbox does not precache larger files
const MAX_TOTAL_BYTES = 20 * 1024 * 1024;

const files = [...new Set(PIANO_SAMPLE_MAP.map((region) => region.file))].sort();

describe('piano sample files', () => {
  it('has a file for every region of the map, and nothing else', () => {
    expect(readdirSync(SAMPLES).sort()).toEqual(files);
  });

  it('keeps every file small enough to precache, and the total within the budget', () => {
    const sizes = files.map((file) => statSync(join(SAMPLES, file)).size);
    expect(Math.max(...sizes)).toBeLessThan(MAX_FILE_BYTES);
    expect(sizes.reduce((sum, size) => sum + size, 0)).toBeLessThanOrEqual(MAX_TOTAL_BYTES);
  });

  it('holds MP3 files', () => {
    for (const file of files) {
      const head = readFileSync(join(SAMPLES, file)).subarray(0, 3);
      // An ID3 tag, or an MPEG frame sync.
      const isMp3 =
        head.toString('latin1') === 'ID3' || (head[0] === 0xff && (head[1] & 0xe0) === 0xe0);
      expect(isMp3, file).toBe(true);
    }
  });

  it('covers every key A0–C8 and every velocity within two semitones', () => {
    expect(mapProblems(PIANO_SAMPLE_MAP)).toEqual([]);
  });
});

describe('piano sample licence', () => {
  const record = readFileSync(fromRoot('licenses/piano-samples.md'), 'utf8');

  it('names the CC0 1.0 sentence of the source page, the page, the version, and a check date', () => {
    expect(record).toContain(
      'Published under the terms of the Creative Commons CC0 1.0 public domain dedication.',
    );
    expect(record).toContain('https://freepats.zenvoid.org/Piano/acoustic-grand-piano.html');
    expect(record).toContain('Upright Piano KW');
    expect(record).toContain('2022-02-21');
    expect(record).toMatch(/\*\*Checked:\*\* \d{4}-\d{2}-\d{2}/);
  });

  it('says that CC0 does not waive patent or trademark rights, and lists the changes', () => {
    expect(record).toMatch(/does not waive patent or trademark rights/);
    expect(record).toMatch(/## Changes made/);
  });
});

describe('piano brand', () => {
  // The brand of the recorded piano is named only in the licence record and the README credits.
  const SHIPPED = ['src', 'index.html', 'vite.config.ts', 'public'];

  function textFilesUnder(path: string): string[] {
    if (!existsSync(path)) return [];
    if (!statSync(path).isDirectory()) return [path];
    return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
      const full = join(path, entry.name);
      if (entry.isDirectory()) return entry.name === 'library' ? [] : textFilesUnder(full);
      return /\.(ts|tsx|html|css|json|svg|webmanifest)$/.test(entry.name) ? [full] : [];
    });
  }

  it('does not appear in the app, the manifest, or the build configuration', () => {
    for (const path of SHIPPED.flatMap((entry) => textFilesUnder(fromRoot(entry)))) {
      expect(readFileSync(path, 'utf8').toLowerCase(), path).not.toContain('kawai');
    }
  });
});
