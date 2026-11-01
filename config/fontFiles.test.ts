// Checks the self-hosted UI font: the files exist and are small, and the licence is recorded.
// It lives in `config/` because it reads the disk (that project has the Node types).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const fromRoot = (path: string) =>
  new URL(`../${path}`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const FONTS = fromRoot('src/assets/fonts/');
const SCRIPTS = ['cyrillic-ext', 'cyrillic', 'latin-ext', 'latin'];

describe('self-hosted Manrope', () => {
  it('has one WOFF2 file per script, and nothing else', () => {
    expect(readdirSync(FONTS).sort()).toEqual(SCRIPTS.map((s) => `manrope-${s}.woff2`).sort());
  });

  it('holds real WOFF2 files that are small enough to precache', () => {
    for (const script of SCRIPTS) {
      const path = join(FONTS, `manrope-${script}.woff2`);
      expect(readFileSync(path).subarray(0, 4).toString('latin1'), script).toBe('wOF2');
      expect(statSync(path).size, script).toBeLessThan(100 * 1024);
    }
  });

  it('declares every file in index.css and never loads a font from another host', () => {
    const css = readFileSync(fromRoot('src/index.css'), 'utf8');
    for (const script of SCRIPTS) expect(css).toContain(`manrope-${script}.woff2`);
    expect(css).not.toMatch(/https?:\/\//);
    expect(readFileSync(fromRoot('index.html'), 'utf8')).not.toMatch(/fonts\.(googleapis|gstatic)/);
  });

  it('records the OFL licence', () => {
    expect(existsSync(fromRoot('licenses/Manrope-OFL-1.1.txt'))).toBe(true);
    const record = readFileSync(fromRoot('licenses/manrope.md'), 'utf8');
    expect(record).toContain('SIL Open Font License 1.1');
    expect(record).toMatch(/Checked:\*\* \d{4}-\d{2}-\d{2}/);
  });
});
