import { createContext, useContext } from 'react';
import type { Locale, Params } from './core.ts';
import type { MessageKey, PluralKey } from './locales/en.ts';

export interface I18nValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, params?: Params) => string;
  /** Plural-aware lookup: picks the form for `count`; `{count}` is filled in. */
  tp: (key: PluralKey, count: number, params?: Params) => string;
}

export const I18nContext = createContext<I18nValue | null>(null);

function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('I18nProvider is missing');
  return value;
}

/** Returns the `t(key, params?)` function for the current language. */
export function useT(): I18nValue['t'] {
  return useI18n().t;
}

/** Returns the `tp(key, count, params?)` function for the current language. */
export function usePluralT(): I18nValue['tp'] {
  return useI18n().tp;
}

export function useLocale(): Pick<I18nValue, 'locale' | 'setLocale'> {
  const { locale, setLocale } = useI18n();
  return { locale, setLocale };
}
