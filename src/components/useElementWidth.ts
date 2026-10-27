import { useEffect, useState } from 'react';

/**
 * The content width (whole px) of the element returned by `getElement`, kept up to date with a
 * ResizeObserver (so phone rotation counts too). Updates are throttled to one per animation
 * frame. `getElement` must be a stable function.
 */
export function useElementWidth(getElement: () => Element | null, initial: number): number {
  const [width, setWidth] = useState(initial);

  useEffect(() => {
    const element = getElement();
    if (!element) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setWidth(Math.round(element.clientWidth)));
    };
    const observer = new ResizeObserver(update);
    observer.observe(element);
    update();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [getElement]);

  return width;
}
