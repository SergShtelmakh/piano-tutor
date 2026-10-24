import { createContext, useContext } from 'react';
import type { Locale } from './core.ts';
import type { TranslationKey } from './locales/en.ts';

export interface I18nValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

export const I18nContext = createContext<I18nValue | null>(null);

function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('I18nProvider is missing');
  return value;
}

/** Returns the `t(key)` function for the current language. */
export function useT(): I18nValue['t'] {
  return useI18n().t;
}

export function useLocale(): Pick<I18nValue, 'locale' | 'setLocale'> {
  const { locale, setLocale } = useI18n();
  return { locale, setLocale };
}
