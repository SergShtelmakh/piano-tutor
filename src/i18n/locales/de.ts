import type { PartialTranslations } from './en.ts';

export const de: PartialTranslations = {
  appName: 'Piano Tutor',
  tagline: 'Klavier lernen durch Spielen – mit sofortigem Feedback zu jeder Note.',
  playHint:
    'Spiele mit einem MIDI-Keyboard, dem Bildschirm-Klavier oder deiner Computertastatur: A S D F G H J K L ; sind die weißen Tasten, W E T Y U O P die schwarzen, und mit Z / X wechselst du die Oktave.',
  languageLabel: 'Sprache',
  documentTitle: 'Piano Tutor – Klavier lernen durch Spielen',
  midiConnect: 'MIDI-Keyboard verbinden',
  midiConnecting: 'Verbinde …',
  midiConnected: 'Verbunden:',
  midiNoDevices:
    'MIDI ist erlaubt, aber es ist kein Keyboard angeschlossen. Schließe eines an, dann erscheint es hier.',
  midiDenied:
    'Der MIDI-Zugriff wurde blockiert oder abgebrochen. Erlaube MIDI für diese Seite (in Firefox bestätige das Berechtigungs-Add-on) und versuche es erneut.',
  midiUnsupported:
    'Dieser Browser unterstützt kein MIDI. Nutze Chrome oder Edge, um ein MIDI-Keyboard zu verbinden, oder spiele mit dem Bildschirm-Klavier oder deiner Computertastatur.',
  midiInsecure:
    'MIDI benötigt eine sichere Seite (HTTPS oder localhost). Mit dem Bildschirm-Klavier und der Computertastatur kannst du trotzdem spielen.',
  volumeLabel: 'Lautstärke',
  mute: 'Stummschalten',
  unmute: 'Ton einschalten',
  rangeLabel: 'Bereich',
  octaveDown: 'Oktave tiefer',
  octaveUp: 'Oktave höher',
  pianoLabel: 'Klaviatur',
  buildLabel: 'Build',
  buildLocal: 'lokal',
};
