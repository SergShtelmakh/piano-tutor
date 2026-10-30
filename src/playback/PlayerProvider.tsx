import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { LibraryPiece } from '../core/libraryCatalog.ts';
import { buildScore } from '../core/score.ts';
import type { Piece } from '../core/smf.ts';
import { useNoteBus } from '../input/context.ts';
import { loadLibraryPiece } from '../library/loadLibraryPiece.ts';
import { PlayerContext, type LoadedPiece, type PlayerError, type PlayerValue } from './context.ts';
import { loadScoreFile } from './loadScoreFile.ts';
import { createPlayer } from './player.ts';

/** Keeps the player and the open piece for the whole app, so leaving the Player keeps the piece. */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const bus = useNoteBus();
  const [player] = useState(() => createPlayer(bus));
  const [loaded, setLoaded] = useState<LoadedPiece | null>(null);
  const [error, setError] = useState<PlayerError | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const latestRequest = useRef(0);

  useEffect(() => () => player.dispose(), [player]);

  const show = useCallback(
    (piece: Piece, name: string, library?: LibraryPiece, fileId?: string) => {
      player.load(piece);
      setLoaded({ name, piece, score: buildScore(piece), library, fileId });
      setError(null);
    },
    [player],
  );

  const openFile = useCallback(
    async (file: File) => {
      const request = ++latestRequest.current;
      setLoading(null);
      const result = await loadScoreFile(file);
      if (request !== latestRequest.current) return; // a newer choice was made meanwhile
      if (!result.ok) {
        setError(result.error);
        return;
      }
      show(result.piece, file.name.replace(/\.[^.]*$/, ''), undefined, result.id);
    },
    [show],
  );

  const openLibraryPiece = useCallback(
    async (piece: LibraryPiece) => {
      const request = ++latestRequest.current;
      setLoading(piece.id);
      const result = await loadLibraryPiece(piece);
      if (request !== latestRequest.current) return false;
      setLoading(null);
      if (!result.ok) {
        setError(result.error);
        return false;
      }
      show(result.piece, piece.title, piece);
      return true;
    },
    [show],
  );

  const value = useMemo<PlayerValue>(
    () => ({ player, loaded, error, loading, openFile, openLibraryPiece }),
    [player, loaded, error, loading, openFile, openLibraryPiece],
  );
  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}
