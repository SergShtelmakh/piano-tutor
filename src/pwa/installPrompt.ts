// Captures `beforeinstallprompt` as early as possible (imported from main.tsx before React
// renders) and exposes it as a tiny store for `useSyncExternalStore`.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    emit();
  });
}

export function subscribeInstallPrompt(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function canPromptInstall(): boolean {
  return deferred !== null;
}

/** Opens the browser's install dialog. The event can only be used once. */
export async function promptInstall(): Promise<void> {
  const event = deferred;
  if (!event) return;
  deferred = null;
  emit();
  try {
    await event.prompt();
    await event.userChoice;
  } catch {
    // The dialog could not open; the card stays hidden until the browser offers it again.
  }
}
