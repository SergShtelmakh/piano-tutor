import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { buildScore } from '../core/score.ts';
import type { ParseError } from '../core/smf.ts';
import { useNoteBus } from '../input/context.ts';
import { PlayerContext, type LoadedPiece, type PlayerValue } from './context.ts';
import { loadMidiFile } from './loadMidiFile.ts';
import { createPlayer } from './player.ts';

/** Keeps the player and the open file for the whole app, so leaving the Player keeps the file. */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const bus = useNoteBus();
  const [player] = useState(() => createPlayer(bus));
  const [loaded, setLoaded] = useState<LoadedPiece | null>(null);
  const [error, setError] = useState<ParseError | null>(null);
  const latestRequest = useRef(0);

  useEffect(() => () => player.dispose(), [player]);

  const openFile = useCallback(
    async (file: File) => {
      const request = ++latestRequest.current;
      const result = await loadMidiFile(file);
      if (request !== latestRequest.current) return; // a newer file was chosen meanwhile
      if (!result.ok) {
        setError(result.error);
        return;
      }
      player.load(result.piece);
      setLoaded({
        name: file.name.replace(/\.[^.]*$/, ''),
        piece: result.piece,
        score: buildScore(result.piece),
      });
      setError(null);
    },
    [player],
  );

  const value = useMemo<PlayerValue>(
    () => ({ player, loaded, error, openFile }),
    [player, loaded, error, openFile],
  );
  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}
