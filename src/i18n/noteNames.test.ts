import { describe, expect, it } from 'vitest';
import { SUPPORTED_LOCALES } from './core.ts';
import { NOTE_NAMES, noteLabelFor, noteNameFor } from './noteNames.ts';

const WHITE_KEYS_FROM_C4 = [60, 62, 64, 65, 67, 69, 71];

describe('note names', () => {
  it('has 12 distinct names in every language', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(NOTE_NAMES[locale]).toHaveLength(12);
      expect(new Set(NOTE_NAMES[locale]).size).toBe(12);
    }
  });

  it('uses letters in English with C4 = 60', () => {
    expect(WHITE_KEYS_FROM_C4.map((n) => noteNameFor('en', n))).toEqual([
      'C',
      'D',
      'E',
      'F',
      'G',
      'A',
      'B',
    ]);
    expect(noteLabelFor('en', 60)).toBe('C4');
    expect(noteLabelFor('en', 61)).toBe('C♯4');
    expect(noteLabelFor('en', 21)).toBe('A0');
    expect(noteLabelFor('en', 0)).toBe('C-1');
  });

  it('uses H instead of B in German', () => {
    expect(WHITE_KEYS_FROM_C4.map((n) => noteNameFor('de', n))).toEqual([
      'C',
      'D',
      'E',
      'F',
      'G',
      'A',
      'H',
    ]);
    expect(noteLabelFor('de', 71)).toBe('H4');
    expect(noteNameFor('de', 70)).toBe('A♯');
  });

  it('uses до-ре-мі in Ukrainian', () => {
    expect(WHITE_KEYS_FROM_C4.map((n) => noteNameFor('uk', n))).toEqual([
      'до',
      'ре',
      'мі',
      'фа',
      'соль',
      'ля',
      'сі',
    ]);
    expect(noteLabelFor('uk', 60)).toBe('до4');
    expect(noteLabelFor('uk', 66)).toBe('фа♯4');
  });

  it('uses do-ré-mi in French', () => {
    expect(WHITE_KEYS_FROM_C4.map((n) => noteNameFor('fr', n))).toEqual([
      'do',
      'ré',
      'mi',
      'fa',
      'sol',
      'la',
      'si',
    ]);
    expect(noteLabelFor('fr', 48)).toBe('do3');
  });
});
