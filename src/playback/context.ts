import { createContext, useContext, useSyncExternalStore } from 'react';
import type { Score } from '../core/score.ts';
import type { ParseError, Piece } from '../core/smf.ts';
import type { Player, PlayerState } from './player.ts';

/** The file that is open in the Player. */
export interface LoadedPiece {
  /** The file name without its extension. */
  name: string;
  piece: Piece;
  score: Score;
}

export interface PlayerValue {
  player: Player;
  loaded: LoadedPiece | null;
  /** Why the last chosen file could not be shown; the previous piece stays loaded. */
  error: ParseError | null;
  openFile: (file: File) => Promise<void>;
}

export const PlayerContext = createContext<PlayerValue | null>(null);

export function usePlayerValue(): PlayerValue {
  const value = useContext(PlayerContext);
  if (!value) throw new Error('PlayerProvider is missing');
  return value;
}

/** The coarse player state (playing, rate, position every 100 ms, sounding notes). */
export function usePlayerState(): PlayerState {
  const { player } = usePlayerValue();
  return useSyncExternalStore(player.subscribe, player.getState);
}
