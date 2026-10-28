import type { PlayerError } from './context.ts';

/** The translation key of the message for each reason a piece could not be shown. */
export const PLAYER_ERROR_KEYS = {
  notMidi: 'playerErrorNotMidi',
  unsupported: 'playerErrorUnsupported',
  empty: 'playerErrorEmpty',
  tooLarge: 'playerErrorTooLarge',
  damaged: 'playerErrorDamaged',
  network: 'playerErrorNetwork',
} as const satisfies Record<PlayerError, string>;
