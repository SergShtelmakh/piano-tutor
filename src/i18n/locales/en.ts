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
} as const;

export type TranslationKey = keyof typeof en;
export type PartialTranslations = Partial<Record<TranslationKey, string>>;
