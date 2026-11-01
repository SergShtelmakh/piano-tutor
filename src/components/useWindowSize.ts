import { useEffect, useState, useSyncExternalStore } from 'react';
import { orientationOf, type Orientation } from '../core/lessonLayout.ts';

export interface WindowSize {
  width: number;
  height: number;
  orientation: Orientation;
}

const THROTTLE_MS = 250;

function read(): WindowSize {
  const width = window.innerWidth;
  const height = window.innerHeight;
  return { width, height, orientation: orientationOf(width, height) };
}

/**
 * The window's size in CSS px and its orientation, kept up to date. Updates come at most every 250 ms
 * (the last size always arrives), so a drag-resize doesn't redraw a lesson on every pixel.
 */
export function useWindowSize(): WindowSize {
  const [size, setSize] = useState(read);

  useEffect(() => {
    let timer = 0;
    const update = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const next = read();
        setSize((current) =>
          current.width === next.width && current.height === next.height ? current : next,
        );
      }, THROTTLE_MS);
    };
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return size;
}

/** The orientation of the window (portrait when taller than wide). */
export function useOrientation(): Orientation {
  return useWindowSize().orientation;
}

const SHORT_QUERY = '(max-height: 500px)';

function subscribeShort(onChange: () => void): () => void {
  const query = window.matchMedia(SHORT_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/** A short screen (a phone held sideways): the same test as the `short` Tailwind variant. */
export function useShortScreen(): boolean {
  return useSyncExternalStore(subscribeShort, () => window.matchMedia(SHORT_QUERY).matches);
}
