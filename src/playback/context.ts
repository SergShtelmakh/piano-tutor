import { createContext, useContext, useSyncExternalStore } from 'react';
import type { LibraryPiece } from '../core/libraryCatalog.ts';
import type { Score } from '../core/score.ts';
import type { ParseError, Piece } from '../core/smf.ts';
import type { Player, PlayerState } from './player.ts';

/** The piece that is open in the Player: a file from the learner's disk or a library piece. */
export interface LoadedPiece {
  /** The file name without its extension (for a library piece, its title). */
  name: string;
  piece: Piece;
  score: Score;
  /** Set when the piece came from the library. */
  library?: LibraryPiece;
  /** `file-<hash>`, set when the piece came from a file on the learner's disk. */
  fileId?: string;
}

/** Why a piece could not be shown. `network` is a library file that could not be fetched. */
export type PlayerError = ParseError | 'network';

export interface PlayerValue {
  player: Player;
  loaded: LoadedPiece | null;
  /** Why the last chosen file could not be shown; the previous piece stays loaded. */
  error: PlayerError | null;
  /** The id of the library piece that is being fetched, or null. */
  loading: string | null;
  openFile: (file: File) => Promise<void>;
  /** Resolves to true when the piece is now open. */
  openLibraryPiece: (piece: LibraryPiece) => Promise<boolean>;
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
