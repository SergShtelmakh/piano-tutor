// Pure translation logic: no React, DOM, or storage imports.
import { en, type PartialTranslations, type TranslationKey } from './locales/en.ts';
import { uk } from './locales/uk.ts';
import { de } from './locales/de.ts';
import { fr } from './locales/fr.ts';

export const SUPPORTED_LOCALES = ['en', 'uk', 'de', 'fr'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/** Each language is shown by its own name. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  uk: 'Українська',
  de: 'Deutsch',
  fr: 'Français',
};

const dictionaries: Record<Locale, PartialTranslations> = { en, uk, de, fr };

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * Initial language: a valid saved choice wins; otherwise the first browser language whose
 * primary subtag is supported (`de-AT` -> `de`); otherwise English.
 */
export function resolveInitialLocale(
  saved: string | null | undefined,
  browserLanguages: readonly string[],
): Locale {
  if (isLocale(saved)) return saved;
  for (const tag of browserLanguages) {
    const primary = tag.trim().toLowerCase().split(/[-_]/)[0];
    if (isLocale(primary)) return primary;
  }
  return DEFAULT_LOCALE;
}

/** Looks the key up in a (possibly incomplete) dictionary and falls back to English. */
export function lookup(dictionary: PartialTranslations, key: TranslationKey): string {
  return dictionary[key] ?? en[key];
}

export function translate(locale: Locale, key: TranslationKey): string {
  return lookup(dictionaries[locale], key);
}
