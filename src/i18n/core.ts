// Pure translation logic: no React, DOM, or storage imports.
import {
  en,
  type MessageKey,
  type PartialTranslations,
  type PluralForms,
  type PluralKey,
} from './locales/en.ts';
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

/** Values for `{name}` placeholders. */
export type Params = Record<string, string | number>;

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

/** Replaces `{name}` with `params.name`; a placeholder without a value is left as it is. */
export function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    Object.hasOwn(params, name) ? String(params[name]) : placeholder,
  );
}

/** Looks the key up in a (possibly incomplete) dictionary and falls back to English. */
export function lookup(dictionary: PartialTranslations, key: MessageKey): string {
  return dictionary[key] ?? en[key];
}

export function translate(locale: Locale, key: MessageKey, params?: Params): string {
  return interpolate(lookup(dictionaries[locale], key), params);
}

const pluralRules = new Map<string, Intl.PluralRules>();

function pluralCategory(locale: string, count: number): Intl.LDMLPluralRule {
  let rules = pluralRules.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(locale);
    pluralRules.set(locale, rules);
  }
  return rules.select(count);
}

function pickForm(locale: string, forms: PluralForms | undefined, count: number) {
  return forms?.[pluralCategory(locale, count)] ?? forms?.other;
}

/**
 * Picks the plural form for `count` using the locale's plural rules. A missing form falls back
 * to the locale's `other`; a key the locale does not have falls back to English (with English
 * rules). The result still contains its `{count}` placeholder.
 */
export function lookupPlural(
  dictionary: PartialTranslations,
  locale: string,
  key: PluralKey,
  count: number,
): string {
  return pickForm(locale, dictionary[key], count) ?? pickForm('en', en[key], count) ?? '';
}

export function translatePlural(
  locale: Locale,
  key: PluralKey,
  count: number,
  params?: Params,
): string {
  return interpolate(lookupPlural(dictionaries[locale], locale, key, count), {
    count,
    ...params,
  });
}

/** A ratio from 0 to 1 as a whole percentage in the locale's style, e.g. `85 %` in French. */
export function formatPercent(locale: Locale, ratio: number): string {
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(
    ratio,
  );
}
