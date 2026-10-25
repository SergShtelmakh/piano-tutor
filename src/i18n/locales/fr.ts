import type { PartialTranslations } from './en.ts';

export const fr: PartialTranslations = {
  appName: 'Piano Tutor',
  tagline: 'Apprenez le piano en jouant — avec un retour instantané sur chaque note.',
  playHint:
    'Jouez avec un clavier MIDI, le piano à l’écran ou le clavier de votre ordinateur : A S D F G H J K L ; sont les touches blanches, W E T Y U O P les touches noires, et Z / X changent d’octave.',
  languageLabel: 'Langue',
  documentTitle: 'Piano Tutor — apprenez le piano en jouant',
  midiConnect: 'Connecter un clavier MIDI',
  midiConnecting: 'Connexion…',
  midiConnected: 'Connecté :',
  midiNoDevices:
    'Le MIDI est autorisé, mais aucun clavier n’est branché. Branchez-en un et il apparaîtra ici.',
  midiDenied:
    'L’accès au MIDI a été bloqué ou annulé. Autorisez le MIDI pour ce site (dans Firefox, confirmez le module de permission), puis réessayez.',
  midiUnsupported:
    'Ce navigateur ne prend pas en charge le MIDI. Utilisez Chrome ou Edge pour connecter un clavier MIDI, ou jouez avec le piano à l’écran ou le clavier de votre ordinateur.',
  midiInsecure:
    'Le MIDI nécessite une page sécurisée (HTTPS ou localhost). Vous pouvez quand même jouer avec le piano à l’écran ou le clavier de votre ordinateur.',
  volumeLabel: 'Volume',
  mute: 'Couper le son',
  unmute: 'Rétablir le son',
  rangeLabel: 'Plage',
  octaveDown: 'Octave inférieure',
  octaveUp: 'Octave supérieure',
  pianoLabel: 'Clavier de piano',
  buildLabel: 'Version',
  buildLocal: 'locale',
  modeFree: 'Jeu libre',
  modeLesson: 'Leçon',
  modeLabel: 'Mode',
  lessonNoteReadingTitle: 'Lecture de notes',
  lessonInstruction: 'Jouez la note indiquée sur la portée.',
  staffLabel: 'Portée',
  staffTargetLabel: 'Note cible : {note}',
  lessonProgress: 'Étape {current} sur {total}',
  lessonRestart: 'Recommencer',
  lessonBack: 'Retour au jeu libre',
  correctCount: { one: '{count} note correcte', other: '{count} notes correctes' },
  mistakesCount: { one: '{count} erreur', other: '{count} erreurs' },
  summaryTitle: 'Leçon terminée',
  summaryAccuracy: 'Précision : {percent}',
  summaryAgain: 'Rejouer',
};
