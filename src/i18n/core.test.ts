import { describe, expect, it } from 'vitest';
import {
  LOCALE_NAMES,
  SUPPORTED_LOCALES,
  isLocale,
  formatPercent,
  interpolate,
  lookup,
  lookupPlural,
  resolveInitialLocale,
  translate,
  translatePlural,
} from './core.ts';
import { en, type PluralKey, type TranslationKey } from './locales/en.ts';
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

describe('interpolate', () => {
  it('fills placeholders, numbers included', () => {
    expect(interpolate('Step {current} of {total}', { current: 3, total: 20 })).toBe(
      'Step 3 of 20',
    );
    expect(interpolate('{a}{a}', { a: 'x' })).toBe('xx');
  });

  it('leaves unknown placeholders and plain text as they are', () => {
    expect(interpolate('Play {note}', {})).toBe('Play {note}');
    expect(interpolate('Play {note}')).toBe('Play {note}');
    expect(interpolate('no placeholders', { note: 'C4' })).toBe('no placeholders');
  });

  it('does not treat inherited object keys as values', () => {
    expect(interpolate('{toString}', {})).toBe('{toString}');
  });

  it('is used by translate', () => {
    expect(translate('de', 'lessonProgress', { current: 2, total: 20 })).toBe('Schritt 2 von 20');
    expect(translate('en', 'staffTargetLabel', { note: 'C4' })).toBe('Target note: C4');
  });
});

describe('translatePlural', () => {
  it('uses one / other in English', () => {
    expect(translatePlural('en', 'mistakesCount', 1)).toBe('1 mistake');
    expect(translatePlural('en', 'mistakesCount', 2)).toBe('2 mistakes');
    expect(translatePlural('en', 'mistakesCount', 0)).toBe('0 mistakes');
  });

  it('uses one / few / many in Ukrainian', () => {
    const forms = [
      [1, '1 помилка'],
      [2, '2 помилки'],
      [4, '4 помилки'],
      [5, '5 помилок'],
      [11, '11 помилок'],
      [12, '12 помилок'],
      [21, '21 помилка'],
      [22, '22 помилки'],
      [25, '25 помилок'],
      [0, '0 помилок'],
    ] as const;
    for (const [count, text] of forms) {
      expect(translatePlural('uk', 'mistakesCount', count), String(count)).toBe(text);
    }
  });

  it('uses one for 0 and 1 in French', () => {
    expect(translatePlural('fr', 'mistakesCount', 0)).toBe('0 erreur');
    expect(translatePlural('fr', 'mistakesCount', 1)).toBe('1 erreur');
    expect(translatePlural('fr', 'mistakesCount', 2)).toBe('2 erreurs');
  });

  it('lookupPlural returns the template with its placeholders untouched', () => {
    expect(
      lookupPlural({ mistakesCount: { other: '{count} x {name}' } }, 'en', 'mistakesCount', 3),
    ).toBe('{count} x {name}');
  });
});

describe('lookupPlural fallbacks', () => {
  it('falls back to the locale other when a category is missing', () => {
    const dict = { mistakesCount: { one: 'ONE', other: 'OTHER' } };
    expect(lookupPlural(dict, 'uk', 'mistakesCount', 2)).toBe('OTHER'); // uk "few" is missing
    expect(lookupPlural(dict, 'uk', 'mistakesCount', 1)).toBe('ONE');
  });

  it('falls back to English, with English rules, when the locale has no entry', () => {
    expect(lookupPlural({}, 'uk', 'mistakesCount', 1)).toBe('{count} mistake');
    expect(lookupPlural({}, 'uk', 'mistakesCount', 2)).toBe('{count} mistakes');
  });
});

describe('formatPercent', () => {
  it('rounds to a whole percentage in the locale style', () => {
    expect(formatPercent('en', 0.8)).toBe('80%');
    expect(formatPercent('en', 1)).toBe('100%');
    expect(formatPercent('en', 5 / 6)).toBe('83%');
    // French puts a (non-breaking) space before the sign.
    expect(formatPercent('fr', 0.8).replace(/\s/g, ' ')).toBe('80 %');
  });
});

describe('plural entries in locales', () => {
  const pluralKeys = (Object.keys(en) as TranslationKey[]).filter(
    (key): key is PluralKey => typeof en[key] !== 'string',
  );

  it('give every locale the forms its language needs', () => {
    expect(pluralKeys.length).toBeGreaterThan(0);
    const needed = {
      uk: ['one', 'few', 'many', 'other'],
      de: ['one', 'other'],
      fr: ['one', 'other'],
    };
    for (const [name, dict] of Object.entries({ uk, de, fr })) {
      for (const key of pluralKeys) {
        for (const form of needed[name as keyof typeof needed]) {
          expect(dict[key]?.[form as 'one'], `${name}.${key}.${form}`).toBeTruthy();
        }
      }
    }
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
