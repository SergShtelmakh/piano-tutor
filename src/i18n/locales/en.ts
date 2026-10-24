// Source of truth for translation keys: the key type is derived from this object.
export const en = {
  appName: 'Piano Tutor',
  tagline: 'Learn piano by playing — with instant feedback on every note.',
  comingSoon: 'Lessons are on their way. Connect your keyboard soon and start playing!',
  languageLabel: 'Language',
  documentTitle: 'Piano Tutor — learn piano by playing',
} as const;

export type TranslationKey = keyof typeof en;
export type PartialTranslations = Partial<Record<TranslationKey, string>>;
