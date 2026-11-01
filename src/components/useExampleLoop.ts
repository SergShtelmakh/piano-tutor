import { useEffect, useState } from 'react';

/**
 * A step counter for the layout editor's silent example: it moves to the next step every
 * `intervalMs` and starts over after the last one. It stands still while the page is hidden and
 * goes on from the same step when it is shown again.
 */
export function useExampleLoop(stepCount: number, intervalMs: number): number {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (stepCount <= 0) return;
    let timer = 0;
    const start = () => {
      window.clearInterval(timer);
      timer = window.setInterval(() => setStep((current) => (current + 1) % stepCount), intervalMs);
    };
    const onVisibility = () => {
      if (document.hidden) window.clearInterval(timer);
      else start();
    };
    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [stepCount, intervalMs]);

  return step;
}
