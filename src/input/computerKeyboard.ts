import { noteForCode, OCTAVE_DOWN_CODE, OCTAVE_UP_CODE } from '../core/computerKeymap.ts';
import type { NoteBus } from './noteBus.ts';

export const COMPUTER_KEY_VELOCITY = 90;

function isFormControl(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement && target.matches('input, select, textarea, [contenteditable]')
  );
}

/**
 * Plays notes from the computer keyboard by physical key position (`KeyboardEvent.code`).
 * Returns a function that detaches the listeners and releases held notes.
 */
export function attachComputerKeyboard(
  bus: NoteBus,
  getBaseOctave: () => number,
  shiftOctave: (delta: number) => void,
): () => void {
  // code -> the note it started, so a key released after an octave shift stops the right note
  const pressed = new Map<string, number>();

  function releaseAll() {
    for (const note of pressed.values()) bus.emit({ type: 'noteoff', note, source: 'computer' });
    pressed.clear();
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey || event.altKey || event.metaKey || isFormControl(event.target)) return;

    if (event.code === OCTAVE_DOWN_CODE || event.code === OCTAVE_UP_CODE) {
      event.preventDefault();
      if (!event.repeat) shiftOctave(event.code === OCTAVE_UP_CODE ? 1 : -1);
      return;
    }

    const note = noteForCode(event.code, getBaseOctave());
    if (note === null) return;
    event.preventDefault();
    if (event.repeat || pressed.has(event.code)) return;
    pressed.set(event.code, note);
    bus.emit({ type: 'noteon', note, velocity: COMPUTER_KEY_VELOCITY, source: 'computer' });
  }

  function onKeyUp(event: KeyboardEvent) {
    const note = pressed.get(event.code);
    if (note === undefined) return;
    pressed.delete(event.code);
    bus.emit({ type: 'noteoff', note, source: 'computer' });
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', releaseAll);
  return () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', releaseAll);
    releaseAll();
  };
}
