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
  modeLabel: 'Mode',
  unitTrebleTitle: 'Right hand · treble clef',
  unitBassTitle: 'Left hand · bass clef',
  unitBothTitle: 'Both clefs',
  unitMelodiesTitle: 'Melodies',
  unitChordsTitle: 'Intervals & chords',
  lessonTrebleCGTitle: 'Middle C to G',
  lessonNoteReadingTitle: 'Around middle C',
  lessonTrebleGETitle: 'Up to high E',
  lessonBassCGTitle: 'C to G in the bass',
  lessonBassOctaveTitle: 'The whole bass octave',
  lessonBothClefsTitle: 'Across middle C',
  lessonMelodyMaryTitle: 'Mary Had a Little Lamb',
  lessonMelodyOdeTitle: 'Ode to Joy',
  lessonMelodyTwinkleTitle: 'Twinkle, Twinkle, Little Star',
  lessonMelodyOdeLeftTitle: 'Ode to Joy (left hand)',
  lessonIntervalsTitle: 'Intervals',
  lessonChordsMajorTitle: 'Major chords: C, F, G',
  lessonChordsAllTitle: 'Major and minor chords',
  lessonInstructionNotes: 'Play the highlighted note. The row shows what comes next.',
  lessonInstructionChords: 'Press all notes of the highlighted chord at the same time.',
  staffLabel: 'Music staff',
  staffTargetLabel: 'Target note: {note}',
  staffTargetsLabel: 'Target notes: {notes}',
  lessonProgress: 'Step {current} of {total}',
  lessonRestart: 'Restart',
  lessonBack: 'Back to home',
  correctCount: { one: '{count} correct note', other: '{count} correct notes' },
  mistakesCount: { one: '{count} mistake', other: '{count} mistakes' },
  summaryTitle: 'Lesson complete',
  summaryAccuracy: 'Accuracy: {percent}',
  summaryAgain: 'Play again',
  modeHome: 'Home',
  homeLessonsTitle: 'Lessons',
  statsLevel: 'Level {level}',
  statsXp: '{into} / {needed} XP',
  statsXpBarLabel: 'Progress to the next level',
  statsStreakLabel: 'Streak',
  statsBestStreakLabel: 'Best streak',
  streakCount: { one: '{count} day', other: '{count} days' },
  progressNotSaved:
    "Progress can't be saved in this browser. It will be lost when you close the page.",
  lessonStart: 'Start',
  lessonNotPlayed: 'Not played yet',
  lessonNextBadge: 'Next',
  lessonBestAccuracy: 'Best: {percent}',
  runsCount: { one: '{count} run', other: '{count} runs' },
  starsLabel: '{stars} of 3 stars',
  resetProgress: 'Reset progress',
  resetConfirmText: 'Are you sure? This cannot be undone.',
  resetConfirm: 'Reset',
  resetCancel: 'Cancel',
  rewardXp: '+{xp} XP',
  rewardLevelUp: 'Level up! You reached level {level}',
  rewardStreak: 'Streak:',
  rewardNewBestStreak: 'New best streak!',
  rewardNewBestAccuracy: 'New best!',
  offlineReady: 'Piano Tutor now works offline.',
  offlineReadyOk: 'OK',
  updateAvailable: 'A new version is available.',
  updateReload: 'Reload',
  updateLater: 'Later',
  installTitle: 'Install Piano Tutor',
  installText: 'Open it from your home screen and practise offline.',
  installAction: 'Install',
  installNotNow: 'Not now',
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
