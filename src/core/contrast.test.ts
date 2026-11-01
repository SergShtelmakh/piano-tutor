import { describe, expect, it } from 'vitest';
import { contrastRatio, luminance, parseHex } from './contrast.ts';

describe('parseHex', () => {
  it('reads long and short forms', () => {
    expect(parseHex('#0E1117')).toEqual([14, 17, 23]);
    expect(parseHex('#fff')).toEqual([255, 255, 255]);
  });

  it('rejects anything else', () => {
    expect(parseHex('red')).toBeNull();
    expect(parseHex('#12345')).toBeNull();
    expect(parseHex('rgb(0,0,0)')).toBeNull();
  });
});

describe('luminance', () => {
  it('is 0 for black and 1 for white', () => {
    expect(luminance([0, 0, 0])).toBe(0);
    expect(luminance([255, 255, 255])).toBeCloseTo(1, 10);
  });
});

describe('contrastRatio', () => {
  it('is 21 for black on white, in either order', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
  });

  it('is 1 for equal colours', () => {
    expect(contrastRatio('#5ED6C1', '#5ED6C1')).toBe(1);
  });

  it('matches a known pair (#767676 on white is 4.54)', () => {
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 2);
  });

  it('is NaN for an invalid colour', () => {
    expect(contrastRatio('nope', '#ffffff')).toBeNaN();
  });
});
