import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nContext, type I18nValue } from './context.ts';
import { resolveInitialLocale, translate, translatePlural, type Locale } from './core.ts';
import { loadLocale, saveLocale } from './storage.ts';

function detectInitialLocale(): Locale {
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  return resolveInitialLocale(loadLocale(), languages);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectInitialLocale);

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      setLocale: (next) => {
        setLocaleState(next);
        saveLocale(next);
      },
      t: (key, params) => translate(locale, key, params),
      tp: (key, count, params) => translatePlural(locale, key, count, params),
    }),
    [locale],
  );

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = translate(locale, 'documentTitle');
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
