import { describe, expect, it } from 'vitest';
import {
  LOCALE_NAMES,
  SUPPORTED_LOCALES,
  isLocale,
  lookup,
  resolveInitialLocale,
  translate,
} from './core.ts';
import { en, type TranslationKey } from './locales/en.ts';
import { uk } from './locales/uk.ts';
import { de } from './locales/de.ts';
import { fr } from './locales/fr.ts';

describe('isLocale', () => {
  it('accepts supported locales only', () => {
    expect(isLocale('uk')).toBe(true);
    expect(isLocale('es')).toBe(false);
    expect(isLocale(null)).toBe(false);
    expect(isLocale(42)).toBe(false);
  });
});

describe('resolveInitialLocale', () => {
  it('prefers a valid saved locale over the browser language', () => {
    expect(resolveInitialLocale('uk', ['de-DE'])).toBe('uk');
  });

  it('ignores an invalid saved value', () => {
    expect(resolveInitialLocale('xx', ['fr-FR'])).toBe('fr');
    expect(resolveInitialLocale('', [])).toBe('en');
  });

  it('matches the primary subtag of region variants', () => {
    expect(resolveInitialLocale(null, ['de-AT'])).toBe('de');
    expect(resolveInitialLocale(null, ['uk-UA'])).toBe('uk');
    expect(resolveInitialLocale(null, ['fr_CA'])).toBe('fr');
    expect(resolveInitialLocale(null, ['DE-ch'])).toBe('de');
  });

  it('uses the first supported language in list order', () => {
    expect(resolveInitialLocale(null, ['es-ES', 'fr-FR', 'de-DE'])).toBe('fr');
  });

  it('falls back to English for unsupported or empty lists', () => {
    expect(resolveInitialLocale(undefined, ['es-ES', 'ja'])).toBe('en');
    expect(resolveInitialLocale(null, [])).toBe('en');
  });
});

describe('translate', () => {
  it('returns the locale string when present', () => {
    expect(translate('de', 'languageLabel')).toBe('Sprache');
  });

  it('falls back to English when a key is missing', () => {
    expect(lookup({}, 'languageLabel')).toBe('Language');
    expect(lookup({ languageLabel: 'Sprache' }, 'languageLabel')).toBe('Sprache');
  });
});

describe('locale completeness', () => {
  it('provides every key in every non-English locale (phase 1 requirement)', () => {
    const keys = Object.keys(en) as TranslationKey[];
    for (const [name, dict] of Object.entries({ uk, de, fr })) {
      for (const key of keys) {
        expect(dict[key], `${name}.${key}`).toBeTruthy();
      }
    }
  });

  it('has a native name for every supported locale', () => {
    for (const locale of SUPPORTED_LOCALES) expect(LOCALE_NAMES[locale]).toBeTruthy();
  });
});
