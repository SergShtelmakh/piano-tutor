import { useCallback, useState, useSyncExternalStore } from 'react';
import { canPromptInstall, promptInstall, subscribeInstallPrompt } from './installPrompt.ts';
import { shouldShowInstallHint } from './installHint.ts';
import { loadInstallHintDismissed, saveInstallHintDismissed } from './storage.ts';

function isStandalone(): boolean {
  try {
    return window.matchMedia('(display-mode: standalone)').matches;
  } catch {
    return false;
  }
}

/** Install card state for Home: whether to show it, and what its buttons do. */
export function useInstallHint(screen: 'home' | 'free' | 'lesson') {
  const canPrompt = useSyncExternalStore(subscribeInstallPrompt, canPromptInstall, () => false);
  const [dismissed, setDismissed] = useState(loadInstallHintDismissed);

  const dismiss = useCallback(() => {
    saveInstallHintDismissed();
    setDismissed(true);
  }, []);

  return {
    visible: shouldShowInstallHint({ canPrompt, dismissed, standalone: isStandalone(), screen }),
    install: promptInstall,
    dismiss,
  };
}
