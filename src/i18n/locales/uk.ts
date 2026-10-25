import type { PartialTranslations } from './en.ts';

export const uk: PartialTranslations = {
  appName: 'Piano Tutor',
  tagline: 'Вчіться грати на піаніно, граючи — з миттєвим відгуком на кожну ноту.',
  playHint:
    'Грайте на MIDI-клавіатурі, екранному піаніно або клавіатурі комп’ютера: A S D F G H J K L ; — білі клавіші, W E T Y U O P — чорні, а Z / X змінюють октаву.',
  languageLabel: 'Мова',
  documentTitle: 'Piano Tutor — вчіться грати на піаніно, граючи',
  midiConnect: 'Підключити MIDI-клавіатуру',
  midiConnecting: 'Підключення…',
  midiConnected: 'Підключено:',
  midiNoDevices:
    'Доступ до MIDI дозволено, але клавіатура не підключена. Підключіть її, і вона з’явиться тут.',
  midiDenied:
    'Доступ до MIDI заблоковано або скасовано. Дозвольте MIDI для цього сайту (у Firefox підтвердьте встановлення дозволу) й спробуйте ще раз.',
  midiUnsupported:
    'Цей браузер не підтримує MIDI. Скористайтеся Chrome або Edge, щоб підключити MIDI-клавіатуру, або грайте на екранному піаніно чи клавіатурі комп’ютера.',
  midiInsecure:
    'Для MIDI потрібна захищена сторінка (HTTPS або localhost). Грати на екранному піаніно чи клавіатурі комп’ютера все одно можна.',
  volumeLabel: 'Гучність',
  mute: 'Вимкнути звук',
  unmute: 'Увімкнути звук',
  rangeLabel: 'Діапазон',
  octaveDown: 'Октава вниз',
  octaveUp: 'Октава вгору',
  pianoLabel: 'Клавіатура піаніно',
  buildLabel: 'Збірка',
  buildLocal: 'локальна',
  modeFree: 'Вільна гра',
  modeLesson: 'Урок',
  modeLabel: 'Режим',
  lessonNoteReadingTitle: 'Читання нот',
  lessonInstruction: 'Зіграйте ноту, показану на нотному стані.',
  staffTargetLabel: 'Цільова нота: {note}',
  lessonProgress: 'Крок {current} з {total}',
  lessonRestart: 'Почати спочатку',
  lessonBack: 'До вільної гри',
  correctCount: {
    one: '{count} правильна нота',
    few: '{count} правильні ноти',
    many: '{count} правильних нот',
    other: '{count} правильної ноти',
  },
  mistakesCount: {
    one: '{count} помилка',
    few: '{count} помилки',
    many: '{count} помилок',
    other: '{count} помилки',
  },
  summaryTitle: 'Урок завершено',
  summaryAccuracy: 'Точність: {percent}',
  summaryAgain: 'Зіграти ще раз',
};
