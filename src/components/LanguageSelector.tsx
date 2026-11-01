import { useId } from 'react';
import { useLocale, useT } from '../i18n/context.ts';
import { LOCALE_NAMES, SUPPORTED_LOCALES, isLocale } from '../i18n/core.ts';

export default function LanguageSelector() {
  const t = useT();
  const { locale, setLocale } = useLocale();
  const id = useId();

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="sr-only">
        {t('languageLabel')}
      </label>
      <select
        id={id}
        value={locale}
        onChange={(e) => {
          if (isLocale(e.target.value)) setLocale(e.target.value);
        }}
        className="h-14 w-full max-w-sm rounded-2xl border-[1.5px] border-line bg-bg px-4 text-base font-bold text-ink"
      >
        {SUPPORTED_LOCALES.map((code) => (
          <option key={code} value={code} lang={code}>
            {LOCALE_NAMES[code]}
          </option>
        ))}
      </select>
    </div>
  );
}
