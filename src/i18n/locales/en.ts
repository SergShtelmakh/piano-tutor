// Source of truth for translation keys: the key type is derived from this object.
export const en = {
  appName: 'Piano Tutor',
  tagline: 'Learn piano by playing — with instant feedback on every note.',
  playHint:
    'Play with a MIDI keyboard, the on-screen piano, or your computer keyboard: A S D F G H J K L ; are the white keys, W E T Y U O P the black keys, and Z / X shift the octave.',
  languageLabel: 'Language',
  documentTitle: 'Piano Tutor — learn piano by playing',
  midiConnect: 'Connect MIDI keyboard',
  midiConnecting: 'Connecting…',
  midiConnected: 'Connected:',
  midiNoDevices:
    'MIDI is allowed, but no keyboard is plugged in. Plug one in and it will appear here.',
  midiDenied:
    'MIDI access was blocked or cancelled. Allow MIDI for this site (in Firefox, confirm the permission add-on), then try again.',
  midiUnsupported:
    'This browser does not support MIDI. Use Chrome or Edge to connect a MIDI keyboard, or play with the on-screen piano or your computer keyboard.',
  midiInsecure:
    'MIDI needs a secure page (HTTPS or localhost). You can still play with the on-screen piano or your computer keyboard.',
  volumeLabel: 'Volume',
  mute: 'Mute',
  unmute: 'Unmute',
  rangeLabel: 'Range',
  octaveDown: 'Octave down',
  octaveUp: 'Octave up',
  pianoLabel: 'Piano keyboard',
  buildLabel: 'Build',
  buildLocal: 'local',
  modeFree: 'Free play',
  modeLesson: 'Lesson',
  modeLabel: 'Mode',
  lessonNoteReadingTitle: 'Note reading',
  lessonInstruction: 'Play the note shown on the staff.',
  staffLabel: 'Music staff',
  staffTargetLabel: 'Target note: {note}',
  lessonProgress: 'Step {current} of {total}',
  lessonRestart: 'Restart',
  lessonBack: 'Back to free play',
  correctCount: { one: '{count} correct note', other: '{count} correct notes' },
  mistakesCount: { one: '{count} mistake', other: '{count} mistakes' },
  summaryTitle: 'Lesson complete',
  summaryAccuracy: 'Accuracy: {percent}',
  summaryAgain: 'Play again',
} as const;

type Entries = typeof en;

export type TranslationKey = keyof Entries;
/** Keys whose value is a plain string (use `t`). */
export type MessageKey = {
  [K in TranslationKey]: Entries[K] extends string ? K : never;
}[TranslationKey];
/** Keys whose value has one string per plural category (use `tp`). */
export type PluralKey = Exclude<TranslationKey, MessageKey>;
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>>;
export type PartialTranslations = { [K in MessageKey]?: string } & {
  [K in PluralKey]?: PluralForms;
};
