import { useId } from 'react';
import { useLocale, useT } from '../i18n/context.ts';
import { LOCALE_NAMES, SUPPORTED_LOCALES, isLocale } from '../i18n/core.ts';

export default function LanguageSelector() {
  const t = useT();
  const { locale, setLocale } = useLocale();
  const id = useId();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-sm text-slate-600">
        {t('languageLabel')}
      </label>
      <select
        id={id}
        value={locale}
        onChange={(e) => {
          if (isLocale(e.target.value)) setLocale(e.target.value);
        }}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
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
