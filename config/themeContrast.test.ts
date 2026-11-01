// The dark theme's colours (the @theme block of src/index.css) must stay readable: text pairs at
// least 4.5:1, large text and graphics at least 3:1. It lives in `config/` because it reads the disk.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../src/core/contrast.ts';

const css = readFileSync(
  new URL('../src/index.css', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
  'utf8',
);
const theme = css.slice(css.indexOf('@theme'));
const color = (name: string): string => {
  const match = new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{3,6})\\s*;`).exec(theme);
  if (!match) throw new Error(`token --color-${name} not found`);
  return match[1];
};
const ratio = (fg: string, bg: string) => contrastRatio(color(fg), color(bg));

const TEXT: [string, string][] = [
  ['ink', 'bg'],
  ['ink', 'surface'],
  ['ink', 'surface-raised'],
  ['ink', 'accent-soft'],
  ['ink-muted', 'bg'],
  ['ink-muted', 'surface'],
  ['ink-muted', 'surface-raised'],
  ['ink-muted', 'rail'],
  ['accent-ink', 'accent'],
  ['accent-ink', 'accent-strong'],
  ['accent', 'bg'],
  ['accent', 'surface'],
  ['accent', 'surface-raised'],
  ['accent', 'accent-soft'],
  ['accent', 'rail'],
  ['warm', 'surface'],
  ['wrong', 'bg'],
  ['wrong', 'surface'],
  ['wrong', 'wrong-soft'],
  ['key-label', 'key-white'],
  ['ink-muted', 'key-black'],
];

describe('theme contrast', () => {
  it.each(TEXT)('text %s on %s is at least 4.5:1', (fg, bg) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('draws staff lines and played notes visibly on the card (3:1)', () => {
    expect(ratio('staff', 'surface')).toBeGreaterThanOrEqual(3);
    expect(ratio('staff', 'bg')).toBeGreaterThanOrEqual(3);
  });

  it('keeps the focus ring visible on every background (3:1)', () => {
    for (const bg of ['bg', 'surface', 'surface-raised', 'rail', 'accent-soft'])
      expect(ratio('accent', bg), bg).toBeGreaterThanOrEqual(3);
  });

  it('tells a right press from a wrong one by lightness, not only by hue', () => {
    expect(ratio('accent', 'wrong')).toBeGreaterThanOrEqual(1.2);
  });

  it('shows the hint ring on a white key (3:1)', () => {
    expect(ratio('key-hint', 'key-white')).toBeGreaterThanOrEqual(3);
    expect(ratio('accent', 'key-black')).toBeGreaterThanOrEqual(3);
  });

  it('keeps white keys apart from black keys and both from the page', () => {
    expect(ratio('key-white', 'key-black')).toBeGreaterThanOrEqual(7);
    expect(ratio('key-white', 'bg')).toBeGreaterThanOrEqual(7);
  });

  it('reads black notes on the paper card (4.5:1), with its state colours visible (3:1)', () => {
    expect(ratio('paper-ink', 'paper')).toBeGreaterThanOrEqual(4.5);
    for (const fg of ['paper-staff', 'paper-accent', 'paper-wrong'])
      expect(ratio(fg, 'paper'), fg).toBeGreaterThanOrEqual(3);
    expect(ratio('paper', 'bg')).toBeGreaterThanOrEqual(7);
  });

  it('tells a right press from a wrong one on the paper by lightness too', () => {
    expect(ratio('paper-accent', 'paper-wrong')).toBeGreaterThanOrEqual(1.2);
  });
});
